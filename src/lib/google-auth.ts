import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { OAuth2Client } from "google-auth-library";

export const GOOGLE_SIGNUP_COOKIE = "vynta_google_signup";
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
