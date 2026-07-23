import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  completeGoogleIdentity,
  createGoogleClient,
  getGoogleConfiguration,
  GOOGLE_NATIVE_NONCE_COOKIE,
  secureEqual,
} from "@/lib/google-auth";

export const dynamic = "force-dynamic";

function errorResponse(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: NextRequest) {
  const configuration = getGoogleConfiguration(request.nextUrl.origin);
  if (!configuration) return errorResponse("google_unavailable", 503);

  const expectedNonce = request.cookies.get(GOOGLE_NATIVE_NONCE_COOKIE)?.value;
  const cookieStore = await cookies();
  cookieStore.delete(GOOGLE_NATIVE_NONCE_COOKIE);
  if (!expectedNonce) return errorResponse("google_invalid_state");

  let idToken: string | undefined;
  try {
    const body = (await request.json()) as { idToken?: unknown };
    if (typeof body.idToken === "string") idToken = body.idToken;
  } catch {
    return errorResponse("google_invalid_response");
  }
  if (!idToken || idToken.length > 20_000) return errorResponse("google_invalid_response");

  try {
    const client = createGoogleClient(configuration);
    const ticket = await client.verifyIdToken({ idToken, audience: configuration.clientId });
    const payload = ticket.getPayload();
    const tokenNonce = payload && "nonce" in payload ? String(payload.nonce) : null;
    if (
      !payload?.sub ||
      !payload.email ||
      payload.email_verified !== true ||
      !secureEqual(tokenNonce, expectedNonce)
    ) {
      return errorResponse("google_unverified", 401);
    }

    const completion = await completeGoogleIdentity({
      subject: payload.sub,
      email: payload.email,
      name: payload.name || "",
      avatarUrl: payload.picture || null,
    });
    if (!completion.ok) return errorResponse(completion.error, 409);

    return NextResponse.json({ ok: true, next: completion.next });
  } catch {
    return errorResponse("google_failed", 401);
  }
}
