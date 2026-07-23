import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { OAuth2Client } from "google-auth-library";
import { createSession } from "@/lib/auth";

export const GOOGLE_SIGNUP_COOKIE = "vynta_google_signup";
export const GOOGLE_NATIVE_NONCE_COOKIE = "vynta_google_native_nonce";
export const GOOGLE_FLOW_COOKIES = {
  state: "vynta_google_state",
  nonce: "vynta_google_nonce",
  verifier: "vynta_google_verifier",
} as const;

export interface PendingGoogleProfile {
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface PendingGoogleIdentity extends PendingGoogleProfile {
  subject: string;
  tokenHash: string;
}

export interface VerifiedGoogleIdentity {
  subject: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export type GoogleIdentityCompletion =
  | { ok: true; next: "/feed" | "/onboarding?google=connected" }
  | { ok: false; error: "google_account_conflict" | "account_inactive" };

export function getGoogleConfiguration(origin: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  const configuredBase = process.env.URL?.trim();
  const baseUrl = configuredBase && /^https?:\/\//i.test(configuredBase) ? configuredBase.replace(/\/$/, "") : origin.replace(/\/$/, "");
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || `${baseUrl}/api/auth/google/callback`;
  return { clientId, clientSecret, redirectUri };
}

export function createGoogleClient(configuration: NonNullable<ReturnType<typeof getGoogleConfiguration>>) {
  return new OAuth2Client({
    clientId: configuration.clientId,
    clientSecret: configuration.clientSecret,
    redirectUri: configuration.redirectUri,
  });
}

export function hashOAuthToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function secureEqual(left: string | undefined | null, right: string | undefined | null) {
  if (!left || !right) return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function completeGoogleIdentity(identity: VerifiedGoogleIdentity): Promise<GoogleIdentityCompletion> {
  const { sql } = await import("@/lib/db");
  const email = identity.email.trim().toLowerCase();
  const existingBySubject = await sql`
    SELECT id, account_status FROM users WHERE google_subject = ${identity.subject} LIMIT 1
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
      if (linkedSubject && linkedSubject !== identity.subject) {
        return { ok: false, error: "google_account_conflict" };
      }
      const rows = await sql`
        UPDATE users
        SET google_subject = ${identity.subject},
            auth_provider = CASE WHEN auth_provider = 'password' THEN 'password_google' ELSE 'google' END
        WHERE id = ${existingByEmail[0].id as string}
        RETURNING id, account_status
      `;
      userId = rows[0].id as string;
      accountStatus = rows[0].account_status as string;
    }
  }

  if (userId) {
    if (accountStatus !== "active") return { ok: false, error: "account_inactive" };
    await createSession(userId);
    return { ok: true, next: "/feed" };
  }

  const signupToken = randomBytes(32).toString("base64url");
  const tokenHash = hashOAuthToken(signupToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await sql`
    INSERT INTO oauth_signup_intents (token_hash, provider, provider_subject, email, display_name, avatar_url, expires_at)
    VALUES (${tokenHash}, 'google', ${identity.subject}, ${email}, ${identity.name}, ${identity.avatarUrl}, ${expiresAt})
    ON CONFLICT (provider, provider_subject) DO UPDATE SET
      token_hash = EXCLUDED.token_hash,
      email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      avatar_url = EXCLUDED.avatar_url,
      expires_at = EXCLUDED.expires_at,
      created_at = now()
  `;
  (await cookies()).set(GOOGLE_SIGNUP_COOKIE, signupToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 900,
  });
  return { ok: true, next: "/onboarding?google=connected" };
}

export async function getPendingGoogleIdentity(): Promise<PendingGoogleIdentity | null> {
  const token = (await cookies()).get(GOOGLE_SIGNUP_COOKIE)?.value;
  if (!token || token.length > 256) return null;
  const { sql } = await import("@/lib/db");
  const tokenHash = hashOAuthToken(token);
  const rows = await sql`
    SELECT provider_subject, email, display_name, avatar_url
    FROM oauth_signup_intents
    WHERE token_hash = ${tokenHash} AND provider = 'google' AND expires_at > now()
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return {
    subject: rows[0].provider_subject as string,
    tokenHash,
    email: rows[0].email as string,
    name: rows[0].display_name as string,
    avatarUrl: rows[0].avatar_url as string | null,
  };
}

export async function getPendingGoogleProfile(): Promise<PendingGoogleProfile | null> {
  const identity = await getPendingGoogleIdentity();
  return identity ? { email: identity.email, name: identity.name, avatarUrl: identity.avatarUrl } : null;
}

export async function clearPendingGoogleSignup() {
  (await cookies()).delete(GOOGLE_SIGNUP_COOKIE);
}
