import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getGoogleConfiguration, GOOGLE_NATIVE_NONCE_COOKIE } from "@/lib/google-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const configuration = getGoogleConfiguration(request.nextUrl.origin);
  if (!configuration) {
    return NextResponse.json({ ok: false, error: "google_unavailable" }, { status: 503 });
  }

  const nonce = randomBytes(32).toString("base64url");
  const response = NextResponse.json({ ok: true, clientId: configuration.clientId, nonce });
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(GOOGLE_NATIVE_NONCE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 300,
  });
  return response;
}
