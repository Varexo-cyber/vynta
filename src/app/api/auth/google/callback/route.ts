import { NextRequest, NextResponse } from "next/server";
import {
  completeGoogleIdentity,
  createGoogleClient,
  getGoogleConfiguration,
  GOOGLE_FLOW_COOKIES,
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

    const completion = await completeGoogleIdentity({
      subject: payload.sub,
      email: payload.email,
      name: payload.name || "",
      avatarUrl: payload.picture || null,
    });
    if (!completion.ok) return redirectWithError(request, completion.error);

    const response = NextResponse.redirect(new URL(completion.next, request.url));
    for (const cookie of Object.values(GOOGLE_FLOW_COOKIES)) response.cookies.delete(cookie);
    return response;
  } catch {
    return redirectWithError(request, "google_failed");
  }
}
