import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import {
  createGoogleClient,
  getGoogleConfiguration,
  GOOGLE_FLOW_COOKIES,
  GOOGLE_SIGNUP_COOKIE,
  hashOAuthToken,
  secureEqual,
} from "@/lib/google-auth";

export const dynamic = "force-dynamic";

function redirectWithError(request: NextRequest, error: string) {
  const response = NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(error)}`, request.url));
  for (const cookie of Object.values(GOOGLE_FLOW_COOKIES)) response.cookies.delete(cookie);
  return response;
}

export async function GET(request: NextRequest) {
  const configuration = getGoogleConfiguration(request.nextUrl.origin);
  if (!configuration) return redirectWithError(request, "google_unavailable");
  if (request.nextUrl.searchParams.get("error")) return redirectWithError(request, "google_cancelled");

  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(GOOGLE_FLOW_COOKIES.state)?.value;
  const expectedNonce = request.cookies.get(GOOGLE_FLOW_COOKIES.nonce)?.value;
  const codeVerifier = request.cookies.get(GOOGLE_FLOW_COOKIES.verifier)?.value;
  if (!code || code.length > 4096 || !secureEqual(returnedState, expectedState) || !expectedNonce || !codeVerifier) {
    return redirectWithError(request, "google_invalid_state");
  }

  try {
    const client = createGoogleClient(configuration);
    const { tokens } = await client.getToken({ code, codeVerifier, redirect_uri: configuration.redirectUri });
    if (!tokens.id_token) return redirectWithError(request, "google_no_identity");
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: configuration.clientId });
    const payload = ticket.getPayload();
    const tokenNonce = payload && "nonce" in payload ? String(payload.nonce) : null;
    if (!payload?.sub || !payload.email || payload.email_verified !== true || !secureEqual(tokenNonce, expectedNonce)) {
      return redirectWithError(request, "google_unverified");
    }

    const email = payload.email.trim().toLowerCase();
    const subject = payload.sub;
    const existingBySubject = await sql`
      SELECT id, account_status FROM users WHERE google_subject = ${subject} LIMIT 1
    `;
    let userId: string | null = null;
    let accountStatus: string | null = null;

    if (existingBySubject.length > 0) {
      userId = existingBySubject[0].id as string;
      accountStatus = existingBySubject[0].account_status as string;
    } else {
      const existingByEmail = await sql`
        SELECT id, google_subject, auth_provider, account_status FROM users WHERE email = ${email} LIMIT 1
      `;
      if (existingByEmail.length > 0) {
        const linkedSubject = existingByEmail[0].google_subject as string | null;
        if (linkedSubject && linkedSubject !== subject) return redirectWithError(request, "google_account_conflict");
        const rows = await sql`
          UPDATE users
          SET google_subject = ${subject},
              auth_provider = CASE WHEN auth_provider = 'password' THEN 'password_google' ELSE 'google' END
          WHERE id = ${existingByEmail[0].id as string}
          RETURNING id, account_status
        `;
        userId = rows[0].id as string;
        accountStatus = rows[0].account_status as string;
      }
    }

    if (userId) {
      if (accountStatus !== "active") return redirectWithError(request, "account_inactive");
      await createSession(userId);
      const response = NextResponse.redirect(new URL("/feed", request.url));
      for (const cookie of Object.values(GOOGLE_FLOW_COOKIES)) response.cookies.delete(cookie);
      return response;
    }

    const signupToken = randomBytes(32).toString("base64url");
    const tokenHash = hashOAuthToken(signupToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await sql`
      INSERT INTO oauth_signup_intents (token_hash, provider, provider_subject, email, display_name, avatar_url, expires_at)
      VALUES (${tokenHash}, 'google', ${subject}, ${email}, ${payload.name || ""}, ${payload.picture || null}, ${expiresAt})
      ON CONFLICT (provider, provider_subject) DO UPDATE SET
        token_hash = EXCLUDED.token_hash,
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        avatar_url = EXCLUDED.avatar_url,
        expires_at = EXCLUDED.expires_at,
        created_at = now()
    `;
    const response = NextResponse.redirect(new URL("/onboarding?google=connected", request.url));
    response.cookies.set(GOOGLE_SIGNUP_COOKIE, signupToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 900 });
    for (const cookie of Object.values(GOOGLE_FLOW_COOKIES)) response.cookies.delete(cookie);
    return response;
  } catch {
    return redirectWithError(request, "google_failed");
  }
}
