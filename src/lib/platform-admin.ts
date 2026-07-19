"use server";

import { revalidatePath } from "next/cache";
import { sql } from "./db";
import {
  requireCompanyId,
  requirePlatformAdmin,
  requirePlatformOwner,
  type AccountStatus,
  type PlatformRole,
  type SessionUser,
} from "./auth";

type Result = { ok: boolean; error?: string };
type ReportStatus = "open" | "reviewed" | "dismissed";
type ReportReason = "spam" | "misleiding" | "intimidatie" | "ongepast" | "verdacht" | "fraude" | "anders";

export interface OwnerStats {
  users: number;
  activeUsers: number;
  suspendedUsers: number;
  companies: number;
  posts: number;
  openReports: number;
}

export interface OwnerReport {
  id: string;
  kind: "post" | "chat";
  reason: string;
  details: string | null;
  status: ReportStatus;
  reporterName: string;
  reportedName: string;
  postId: string | null;
  postBody: string | null;
  conversationId: string | null;
  includeMessages: boolean;
  evidence: Array<{ sender: string; body: string; createdAt: string }>;
  moderatorNotes: string | null;
  createdAt: string;
}

export interface OwnerAccount {
  userId: string;
  companyId: string;
  email: string;
  userName: string;
  companyName: string;
  handle: string;
  industry: string;
  city: string;
  province: string;
  country: string;
  phone: string | null;
  website: string | null;
  kvkNumber: string | null;
  vatNumber: string | null;
  platformRole: PlatformRole;
  accountStatus: AccountStatus;
  companyVerified: boolean;
  adminNotes: string | null;
  posts: number;
  reportsReceived: number;
  createdAt: string;
}

export interface OwnerPost {
  id: string;
  companyId: string;
  companyName: string;
  type: string;
  body: string;
  status: string;
  reports: number;
  createdAt: string;
}

export interface OwnerAuditItem {
  id: string;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface OwnerDashboardData {
  viewerRole: PlatformRole;
  viewerUserId: string;
  stats: OwnerStats;
  reports: OwnerReport[];
  accounts: OwnerAccount[];
  posts: OwnerPost[];
  audit: OwnerAuditItem[];
}

async function writeAudit(
  actor: SessionUser,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown> = {}
) {
  await sql`
    INSERT INTO admin_audit_log (actor_user_id, action, target_type, target_id, metadata)
    VALUES (${actor.userId}, ${action}, ${targetType}, ${targetId}, ${JSON.stringify(metadata)}::jsonb)
  `;
}

export async function getOwnerDashboardData(): Promise<OwnerDashboardData> {
  const viewer = await requirePlatformAdmin();

  const [statsRows, chatRows, postReportRows, accountRows, postRows, auditRows] = await Promise.all([
    sql`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM users WHERE account_status = 'active') AS active_users,
        (SELECT COUNT(*) FROM users WHERE account_status = 'suspended') AS suspended_users,
        (SELECT COUNT(*) FROM companies) AS companies,
        (SELECT COUNT(*) FROM needs) AS posts,
        ((SELECT COUNT(*) FROM chat_reports WHERE status = 'open') +
         (SELECT COUNT(*) FROM post_reports WHERE status = 'open')) AS open_reports
    `,
    sql`
      SELECT r.id, r.reason, r.details, r.status, r.conversation_id, r.include_messages,
             r.moderator_notes, r.created_at,
             reporter.name AS reporter_name, reported.name AS reported_name,
             CASE WHEN r.include_messages THEN COALESCE((
               SELECT jsonb_agg(
                 jsonb_build_object(
                   'sender', evidence.sender,
                   'body', evidence.body,
                   'createdAt', evidence.created_at
                 ) ORDER BY evidence.created_at
               )
               FROM (
                 SELECT sender.name AS sender, m.body, m.created_at
                 FROM messages m
                 JOIN companies sender ON sender.id = m.sender_company_id
                 WHERE m.conversation_id = r.conversation_id
                 ORDER BY m.created_at DESC
                 LIMIT 20
               ) evidence
             ), '[]'::jsonb) ELSE '[]'::jsonb END AS evidence
      FROM chat_reports r
      JOIN companies reporter ON reporter.id = r.reporter_id
      JOIN companies reported ON reported.id = r.reported_id
      ORDER BY CASE WHEN r.status = 'open' THEN 0 ELSE 1 END, r.created_at DESC
      LIMIT 100
    `,
    sql`
      SELECT r.id, r.reason, r.details, r.status, r.post_id, r.moderator_notes, r.created_at,
             reporter.name AS reporter_name, reported.name AS reported_name, n.body AS post_body
      FROM post_reports r
      JOIN companies reporter ON reporter.id = r.reporter_company_id
      JOIN companies reported ON reported.id = r.reported_company_id
      LEFT JOIN needs n ON n.id = r.post_id
      ORDER BY CASE WHEN r.status = 'open' THEN 0 ELSE 1 END, r.created_at DESC
      LIMIT 100
    `,
    sql`
      SELECT u.id AS user_id, u.company_id, u.email, u.name AS user_name, u.platform_role,
             u.account_status, u.admin_notes, u.created_at,
             c.name AS company_name, c.handle, c.verified, c.industry, c.city, c.province,
             c.country, c.phone, c.website, c.kvk_number, c.vat_number,
             (SELECT COUNT(*) FROM needs n WHERE n.company_id = c.id) AS posts,
             ((SELECT COUNT(*) FROM chat_reports cr WHERE cr.reported_id = c.id) +
              (SELECT COUNT(*) FROM post_reports pr WHERE pr.reported_company_id = c.id)) AS reports_received
      FROM users u
      JOIN companies c ON c.id = u.company_id
      ORDER BY CASE u.platform_role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, u.created_at DESC
      LIMIT 250
    `,
    sql`
      SELECT n.id, n.company_id, n.type, n.body, n.status, n.created_at, c.name AS company_name,
             (SELECT COUNT(*) FROM post_reports pr WHERE pr.post_id = n.id) AS reports
      FROM needs n
      JOIN companies c ON c.id = n.company_id
      ORDER BY n.created_at DESC
      LIMIT 250
    `,
    sql`
      SELECT l.id, l.action, l.target_type, l.target_id, l.metadata, l.created_at,
             COALESCE(u.name, u.email) AS actor
      FROM admin_audit_log l
      JOIN users u ON u.id = l.actor_user_id
      ORDER BY l.created_at DESC
      LIMIT 150
    `,
  ]);

  const stats = statsRows[0];
  const reports: OwnerReport[] = [
    ...chatRows.map((r) => ({
      id: r.id as string,
      kind: "chat" as const,
      reason: r.reason as string,
      details: r.details as string | null,
      status: r.status as ReportStatus,
      reporterName: r.reporter_name as string,
      reportedName: r.reported_name as string,
      postId: null,
      postBody: null,
      conversationId: r.conversation_id as string | null,
      includeMessages: Boolean(r.include_messages),
      evidence: ((r.evidence ?? []) as Array<{ sender?: unknown; body?: unknown; createdAt?: unknown }>).map((item) => ({
        sender: String(item.sender ?? "Onbekend"),
        body: String(item.body ?? ""),
        createdAt: new Date(String(item.createdAt)).toISOString(),
      })),
      moderatorNotes: r.moderator_notes as string | null,
      createdAt: new Date(r.created_at as string).toISOString(),
    })),
    ...postReportRows.map((r) => ({
      id: r.id as string,
      kind: "post" as const,
      reason: r.reason as string,
      details: r.details as string | null,
      status: r.status as ReportStatus,
      reporterName: r.reporter_name as string,
      reportedName: r.reported_name as string,
      postId: r.post_id as string | null,
      postBody: r.post_body as string | null,
      conversationId: null,
      includeMessages: false,
      evidence: [],
      moderatorNotes: r.moderator_notes as string | null,
      createdAt: new Date(r.created_at as string).toISOString(),
    })),
  ].sort((a, b) => Number(a.status !== "open") - Number(b.status !== "open") || b.createdAt.localeCompare(a.createdAt));

  return {
    viewerRole: viewer.platformRole,
    viewerUserId: viewer.userId,
    stats: {
      users: Number(stats.users),
      activeUsers: Number(stats.active_users),
      suspendedUsers: Number(stats.suspended_users),
      companies: Number(stats.companies),
      posts: Number(stats.posts),
      openReports: Number(stats.open_reports),
    },
    reports,
    accounts: accountRows.map((r) => ({
      userId: r.user_id as string,
      companyId: r.company_id as string,
      email: r.email as string,
      userName: r.user_name as string,
      companyName: r.company_name as string,
      handle: r.handle as string,
      industry: r.industry as string,
      city: r.city as string,
      province: r.province as string,
      country: r.country as string,
      phone: r.phone as string | null,
      website: r.website as string | null,
      kvkNumber: r.kvk_number as string | null,
      vatNumber: r.vat_number as string | null,
      platformRole: r.platform_role as PlatformRole,
      accountStatus: r.account_status as AccountStatus,
      companyVerified: Boolean(r.verified),
      adminNotes: r.admin_notes as string | null,
      posts: Number(r.posts),
      reportsReceived: Number(r.reports_received),
      createdAt: new Date(r.created_at as string).toISOString(),
    })),
    posts: postRows.map((r) => ({
      id: r.id as string,
      companyId: r.company_id as string,
      companyName: r.company_name as string,
      type: r.type as string,
      body: r.body as string,
      status: r.status as string,
      reports: Number(r.reports),
      createdAt: new Date(r.created_at as string).toISOString(),
    })),
    audit: auditRows.map((r) => ({
      id: r.id as string,
      actor: r.actor as string,
      action: r.action as string,
      targetType: r.target_type as string,
      targetId: r.target_id as string,
      metadata: (r.metadata ?? {}) as Record<string, unknown>,
      createdAt: new Date(r.created_at as string).toISOString(),
    })),
  };
}

export async function reportPost(input: {
  postId: string;
  reason: ReportReason;
  details?: string;
}): Promise<Result> {
  const reporterCompanyId = await requireCompanyId();
  if (!("spam misleiding intimidatie ongepast verdacht fraude anders".split(" ") as string[]).includes(input.reason)) {
    return { ok: false, error: "Ongeldige reden." };
  }
  if ((input.details?.length ?? 0) > 1000) return { ok: false, error: "De toelichting is te lang." };
  const rows = await sql`SELECT company_id FROM needs WHERE id = ${input.postId} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Post niet gevonden." };
  const reportedCompanyId = rows[0].company_id as string;
  if (reportedCompanyId === reporterCompanyId) return { ok: false, error: "Je kunt je eigen post niet rapporteren." };
  const duplicate = await sql`
    SELECT 1 FROM post_reports
    WHERE post_id = ${input.postId} AND reporter_company_id = ${reporterCompanyId} AND status = 'open'
    LIMIT 1
  `;
  if (duplicate.length > 0) return { ok: false, error: "Je hebt deze post al gerapporteerd." };
  const inserted = await sql`
    INSERT INTO post_reports (post_id, reporter_company_id, reported_company_id, reason, details)
    VALUES (${input.postId}, ${reporterCompanyId}, ${reportedCompanyId}, ${input.reason}, ${input.details?.trim() || null})
    ON CONFLICT DO NOTHING
    RETURNING id
  `;
  if (inserted.length === 0) return { ok: false, error: "Je hebt deze post al gerapporteerd." };
  revalidatePath("/owner");
  return { ok: true };
}

export async function adminDeletePost(postId: string, reason: string): Promise<Result> {
  const actor = await requirePlatformAdmin();
  if (reason.trim().length < 3) return { ok: false, error: "Vul een moderatiereden in." };
  if (reason.length > 1000) return { ok: false, error: "De moderatiereden is te lang." };
  const rows = await sql`SELECT company_id, body FROM needs WHERE id = ${postId} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Post niet gevonden." };
  await sql`DELETE FROM needs WHERE id = ${postId}`;
  await writeAudit(actor, "post_deleted", "post", postId, {
    reason: reason.trim(),
    companyId: rows[0].company_id,
    excerpt: String(rows[0].body).slice(0, 160),
  });
  revalidatePath("/feed");
  revalidatePath("/owner");
  return { ok: true };
}

export async function adminSetAccountStatus(
  userId: string,
  status: AccountStatus,
  reason: string
): Promise<Result> {
  const actor = await requirePlatformAdmin();
  if (!(["active", "suspended", "deactivated"] as const).includes(status)) return { ok: false, error: "Ongeldige status." };
  const rows = await sql`SELECT platform_role FROM users WHERE id = ${userId} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Account niet gevonden." };
  const targetRole = rows[0].platform_role as PlatformRole;
  if (userId === actor.userId && status !== "active") return { ok: false, error: "Je kunt je eigen owneraccount niet blokkeren." };
  if (actor.platformRole !== "owner" && targetRole !== "member") return { ok: false, error: "Alleen de owner kan beheerders aanpassen." };
  if (status !== "active" && reason.trim().length < 3) return { ok: false, error: "Vul een reden in." };
  if (reason.length > 1000) return { ok: false, error: "De reden is te lang." };
  await sql`
    UPDATE users SET account_status = ${status},
      suspended_at = CASE WHEN ${status} = 'suspended' THEN now() ELSE NULL END,
      suspension_reason = CASE WHEN ${status} = 'active' THEN NULL ELSE ${reason.trim()} END
    WHERE id = ${userId}
  `;
  if (status !== "active") await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
  await writeAudit(actor, "account_status_changed", "user", userId, { status, reason: reason.trim() });
  revalidatePath("/owner");
  return { ok: true };
}

export async function adminSetPlatformRole(userId: string, role: PlatformRole): Promise<Result> {
  const actor = await requirePlatformOwner();
  if (!(["member", "admin", "owner"] as const).includes(role)) return { ok: false, error: "Ongeldige rol." };
  if (userId === actor.userId && role !== "owner") return { ok: false, error: "Je kunt je eigen ownerrol niet verwijderen." };
  const rows = await sql`SELECT platform_role FROM users WHERE id = ${userId} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Account niet gevonden." };
  const previousRole = rows[0].platform_role as PlatformRole;
  await sql`UPDATE users SET platform_role = ${role} WHERE id = ${userId}`;
  await writeAudit(actor, "platform_role_changed", "user", userId, { previousRole, role });
  revalidatePath("/owner");
  return { ok: true };
}

export async function adminSetCompanyVerified(companyId: string, verified: boolean): Promise<Result> {
  const actor = await requirePlatformAdmin();
  const rows = await sql`UPDATE companies SET verified = ${verified} WHERE id = ${companyId} RETURNING id`;
  if (rows.length === 0) return { ok: false, error: "Bedrijf niet gevonden." };
  await writeAudit(actor, verified ? "company_verified" : "company_unverified", "company", companyId);
  revalidatePath("/owner");
  revalidatePath(`/company/${companyId}`);
  revalidatePath("/feed");
  return { ok: true };
}

export async function adminSaveAccountNotes(userId: string, notes: string): Promise<Result> {
  const actor = await requirePlatformAdmin();
  if (notes.length > 5000) return { ok: false, error: "De interne notitie is te lang." };
  const rows = await sql`UPDATE users SET admin_notes = ${notes.trim() || null} WHERE id = ${userId} RETURNING id`;
  if (rows.length === 0) return { ok: false, error: "Account niet gevonden." };
  await writeAudit(actor, "account_notes_updated", "user", userId, { hasNotes: Boolean(notes.trim()) });
  revalidatePath("/owner");
  return { ok: true };
}

export async function adminResolveReport(
  kind: "post" | "chat",
  reportId: string,
  status: Exclude<ReportStatus, "open">,
  notes: string
): Promise<Result> {
  const actor = await requirePlatformAdmin();
  if (status !== "reviewed" && status !== "dismissed") return { ok: false, error: "Ongeldige status." };
  if (notes.length > 5000) return { ok: false, error: "De moderatornotitie is te lang." };
  let rows;
  if (kind === "post") {
    rows = await sql`
      UPDATE post_reports SET status = ${status}, moderator_user_id = ${actor.userId},
        moderator_notes = ${notes.trim() || null}, updated_at = now()
      WHERE id = ${reportId}
      RETURNING id
    `;
  } else {
    rows = await sql`
      UPDATE chat_reports SET status = ${status}, moderator_user_id = ${actor.userId},
        moderator_notes = ${notes.trim() || null}, updated_at = now()
      WHERE id = ${reportId}
      RETURNING id
    `;
  }
  if (rows.length === 0) return { ok: false, error: "Melding niet gevonden." };
  await writeAudit(actor, "report_resolved", `${kind}_report`, reportId, { status, notes: notes.trim() });
  revalidatePath("/owner");
  return { ok: true };
}
