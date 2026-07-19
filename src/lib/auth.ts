import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { sql } from "./db";
import type { Company } from "./types";

const COOKIE = "vynta_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + MAX_AGE * 1000);
  await sql`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${userId}, ${expires})`;
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    await sql`DELETE FROM sessions WHERE token = ${token}`;
    store.delete(COOKIE);
  }
}

export type PlatformRole = "member" | "admin" | "owner";
export type AccountStatus = "active" | "suspended" | "deactivated";

export interface SessionUser {
  userId: string;
  email: string;
  companyRole: string;
  platformRole: PlatformRole;
  accountStatus: AccountStatus;
  company: Company;
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  const rows = await sql`
    SELECT u.id AS user_id, u.email, u.role AS user_role,
           COALESCE(to_jsonb(u)->>'platform_role', 'member') AS platform_role,
           COALESCE(to_jsonb(u)->>'account_status', 'active') AS account_status,
           c.*
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    JOIN companies c ON c.id = u.company_id
    WHERE s.token = ${token} AND s.expires_at > now()
    LIMIT 1`;
  if (rows.length === 0) return null;
  const r = rows[0];
  if (r.account_status !== "active") return null;

  const nets = await sql`
    SELECT network_id FROM network_members WHERE company_id = ${r.id}`;

  const company: Company = {
    id: r.id,
    name: r.name,
    handle: r.handle,
    logoColor: r.logo_color,
    industry: r.industry,
    city: r.city,
    province: r.province ?? "",
    country: r.country,
    municipality: r.municipality ?? undefined,
    municipalityId: r.municipality_id ?? undefined,
    address: r.address ?? undefined,
    postcode: r.postcode ?? undefined,
    description: r.description ?? undefined,
    website: r.website ?? undefined,
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    kvkNumber: r.kvk_number ?? undefined,
    vatNumber: r.vat_number ?? undefined,
    logoUrl: r.logo_url ?? undefined,
    bannerUrl: r.banner_url ?? undefined,
    bannerCropData: r.banner_crop_data ?? undefined,
    logoCropData: r.logo_crop_data ?? undefined,
    verified: r.verified,
    rating: Number(r.rating),
    ratingCount: r.rating_count,
    followers: r.followers,
    following: 0,
    memberSince: new Date(r.created_at).toISOString(),
    products: [],
    networks: nets.map((x) => x.network_id),
  };

  return {
    userId: r.user_id,
    email: r.email,
    companyRole: r.user_role,
    platformRole: r.platform_role as PlatformRole,
    accountStatus: r.account_status as AccountStatus,
    company,
  };
}

export async function requireCompanyId(): Promise<string> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session.company.id;
}

export async function requirePlatformAdmin(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  if (session.platformRole !== "admin" && session.platformRole !== "owner") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requirePlatformOwner(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  if (session.platformRole !== "owner") throw new Error("FORBIDDEN");
  return session;
}
