import { randomBytes } from "node:crypto";
import { CodeChallengeMethod } from "google-auth-library";
import { NextRequest, NextResponse } from "next/server";
import { createGoogleClient, getGoogleConfiguration, GOOGLE_FLOW_COOKIES } from "@/lib/google-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const configuration = getGoogleConfiguration(request.nextUrl.origin);
  if (!configuration) return NextResponse.redirect(new URL("/auth?error=google_unavailable", request.url));

  const client = createGoogleClient(configuration);
  const state = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
  const authorizationUrl = client.generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: CodeChallengeMethod.S256,
  });

  const response = NextResponse.redirect(authorizationUrl);
  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 600 };
  response.cookies.set(GOOGLE_FLOW_COOKIES.state, state, cookieOptions);
  response.cookies.set(GOOGLE_FLOW_COOKIES.nonce, nonce, cookieOptions);
  response.cookies.set(GOOGLE_FLOW_COOKIES.verifier, codeVerifier, cookieOptions);
  return response;
}
