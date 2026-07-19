"use server";

import { revalidatePath } from "next/cache";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import type postgres from "postgres";
import { sql } from "./db";
import {
  createSession,
  destroySession,
  getSession,
  hashPassword,
  verifyPassword,
  requireCompanyId,
} from "./auth";
import type { PostType, LinkPreviewData, PostAttachment, DraftData, Draft } from "./types";
import { sanitizeHtml } from "./rich-text";
import { getMunicipalityByName, getProvinceByName } from "./dutch-networks";

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "bedrijf"
  );
}

const COLORS = ["#6d28d9", "#2563eb", "#16a34a", "#0891b2", "#d97706", "#7c3aed", "#0d9488", "#ea580c"];

type Result = { ok: boolean; error?: string };
const DUMMY_PASSWORD_HASH = "$2b$10$y4v/lwfhyE3cUZ4oqO6EuOl1zGwdtdgdES9tFN3VMhKX27kRjQRUC";

/* ----------------------------- auth ----------------------------- */
export async function signUp(input: {
  companyName: string;
  phone: string;
  email: string;
  password: string;
  address: string;
  postcode: string;
  city: string;
  province: string;
  country: string;
  municipality?: string;
  municipalityId?: string;
  industry: string;
  description?: string;
  website?: string;
  kvkNumber?: string;
  vatNumber?: string;
  logoUrl?: string;
}): Promise<Result> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !input.password || input.password.length < 10 || input.password.length > 200)
    return { ok: false, error: "Vul een geldig e-mailadres en wachtwoord (min. 10 tekens) in." };
  if (input.companyName.length > 120 || input.phone.length > 40 || input.address.length > 180 || input.postcode.length > 16 || input.city.length > 100 || input.province.length > 100 || input.industry.length > 120) {
    return { ok: false, error: "Een of meer velden zijn te lang." };
  }
  if ((input.description?.length ?? 0) > 3000 || (input.website?.length ?? 0) > 500 || (input.kvkNumber?.length ?? 0) > 32 || (input.vatNumber?.length ?? 0) > 32) {
    return { ok: false, error: "Een of meer optionele velden zijn te lang." };
  }
  if (input.website) {
    try {
      const website = new URL(input.website);
      if (website.protocol !== "https:" && website.protocol !== "http:") throw new Error("invalid protocol");
    } catch {
      return { ok: false, error: "Vul een geldige website in, inclusief https://." };
    }
  }
  if (!input.companyName.trim()) return { ok: false, error: "Bedrijfsnaam is verplicht." };
  if (!input.phone.trim()) return { ok: false, error: "Telefoonnummer is verplicht." };
  if (!input.address.trim() || !input.postcode.trim() || !input.city.trim() || !input.province.trim() || !input.country.trim())
    return { ok: false, error: "Adres, postcode, stad, provincie en land zijn verplicht." };
  if (!input.industry.trim()) return { ok: false, error: "Sector is verplicht." };
  if (input.country.trim().toLowerCase() !== "nederland")
    return { ok: false, error: "Vynta is voorlopig alleen beschikbaar voor Nederlandse bedrijven." };

  const existing = await sql`SELECT 1 FROM users WHERE email = ${email} LIMIT 1`;
  if (existing.length > 0) return { ok: false, error: "Dit e-mailadres is al in gebruik." };

  let handle = slugify(input.companyName);
  const taken = await sql`SELECT 1 FROM companies WHERE handle = ${handle} LIMIT 1`;
  if (taken.length > 0) handle = `${handle}-${Math.random().toString(36).slice(2, 6)}`;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  const hash = await hashPassword(input.password);
  const membershipIds: string[] = [];
  const municipality = getMunicipalityByName(input.municipality || input.city);
  if (municipality) membershipIds.push(municipality.id);
  const province = getProvinceByName(input.province);
  if (province) membershipIds.push(`prov-${province.code}`);
  const industrySlug = `ind-${input.industry.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  membershipIds.push(industrySlug, "nat-nl");
  const uniqueMembershipIds = Array.from(new Set(membershipIds)).filter(Boolean);

  let userId: string;
  try {
    userId = await sql.begin(async (tx) => {
      const [company] = await tx`
        INSERT INTO companies (
          name, handle, logo_color, industry,
          city, province, country, municipality, municipality_id, address, postcode,
          description, website, phone, email,
          kvk_number, vat_number, logo_url
        )
        VALUES (
          ${input.companyName.trim()}, ${handle}, ${color}, ${input.industry},
          ${input.city}, ${input.province}, ${input.country},
          ${input.municipality || null}, ${input.municipalityId || null},
          ${input.address}, ${input.postcode},
          ${input.description || null}, ${input.website || null}, ${input.phone}, ${email},
          ${input.kvkNumber || null}, ${input.vatNumber || null}, ${input.logoUrl || null}
        )
        RETURNING id`;
      const companyId = company.id as string;
      const [user] = await tx`
        INSERT INTO users (company_id, email, password_hash, name, role)
        VALUES (${companyId}, ${email}, ${hash}, ${input.companyName.trim()}, 'owner')
        RETURNING id`;

      for (const networkId of uniqueMembershipIds) {
        await tx`
          INSERT INTO network_members (company_id, network_id, origin)
          VALUES (${companyId}, ${networkId}, 'system')
          ON CONFLICT DO NOTHING
        `;
      }
      return user.id as string;
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return { ok: false, error: "Dit e-mailadres of deze bedrijfsnaam is al in gebruik." };
    }
    throw error;
  }

  await createSession(userId);

  return { ok: true };
}

export async function joinNetworks(networkIds: string[]): Promise<Result> {
  const companyId = await requireCompanyId();
  const cleaned = Array.from(new Set(networkIds));
  for (const id of cleaned) {
    await sql`
      INSERT INTO network_members (company_id, network_id, origin)
      VALUES (${companyId}, ${id}, 'onboarding')
      ON CONFLICT (company_id, network_id) DO UPDATE SET origin = EXCLUDED.origin;
    `;
  }
  revalidatePath("/feed");
  revalidatePath("/networks");
  return { ok: true };
}

export async function updateCompany(input: {
  companyName?: string;
  industry?: string;
  description?: string;
  website?: string;
  phone?: string;
  address?: string;
  postcode?: string;
  city?: string;
  province?: string;
  country?: string;
  municipality?: string;
  municipalityId?: string;
  kvkNumber?: string;
  vatNumber?: string;
}): Promise<Result> {
  const companyId = await requireCompanyId();
  if (input.companyName !== undefined && !input.companyName.trim())
    return { ok: false, error: "Bedrijfsnaam mag niet leeg zijn." };

  await sql`
    UPDATE companies SET
      name        = COALESCE(${input.companyName?.trim() ?? null}, name),
      industry    = COALESCE(${input.industry ?? null}, industry),
      description = ${input.description ?? null},
      website     = ${input.website ?? null},
      phone       = ${input.phone ?? null},
      address     = COALESCE(${input.address ?? null}, address),
      postcode    = COALESCE(${input.postcode ?? null}, postcode),
      city        = COALESCE(${input.city ?? null}, city),
      province    = COALESCE(${input.province ?? null}, province),
      country     = COALESCE(${input.country ?? null}, country),
      municipality = COALESCE(${input.municipality ?? null}, municipality),
      municipality_id = COALESCE(${input.municipalityId ?? null}, municipality_id),
      kvk_number  = ${input.kvkNumber ?? null},
      vat_number  = ${input.vatNumber ?? null}
    WHERE id = ${companyId}
  `;

  revalidatePath("/settings");
  revalidatePath(`/company/${companyId}`);
  revalidatePath("/feed");
  return { ok: true };
}

export async function updateCompanyLogo(
  logoUrl: string,
  cropData?: { x: number; y: number; zoom: number } | null
): Promise<Result & { url?: string }> {
  const companyId = await requireCompanyId();
  if (!logoUrl?.trim()) return { ok: false, error: "Geen logo-URL opgegeven." };

  const busteredUrl = `${logoUrl}?v=${Date.now()}`;

  await sql`
    UPDATE companies SET
      logo_url = ${logoUrl},
      logo_crop_data = ${cropData ? JSON.stringify(cropData) : null}
    WHERE id = ${companyId}
  `;

  revalidatePath("/settings");
  revalidatePath(`/company/${companyId}`);
  revalidatePath("/feed");
  revalidatePath("/messages");
  return { ok: true, url: busteredUrl };
}

export async function updateCompanyBanner(
  bannerUrl: string,
  cropData?: { x: number; y: number; zoom: number } | null
): Promise<Result & { url?: string }> {
  const companyId = await requireCompanyId();
  if (!bannerUrl?.trim()) return { ok: false, error: "Geen banner-URL opgegeven." };

  const busteredUrl = `${bannerUrl}?v=${Date.now()}`;

  await sql`
    UPDATE companies SET
      banner_url = ${bannerUrl},
      banner_crop_data = ${cropData ? JSON.stringify(cropData) : null}
    WHERE id = ${companyId}
  `;

  revalidatePath("/settings");
  revalidatePath(`/company/${companyId}`);
  return { ok: true, url: busteredUrl };
}

export async function deleteCompanyLogo(): Promise<Result> {
  const companyId = await requireCompanyId();
  const [row] = await sql`SELECT logo_url FROM companies WHERE id = ${companyId} LIMIT 1`;
  if (row?.logo_url) {
    const path = localUploadPath(row.logo_url);
    if (path) {
      try { await unlink(path); } catch {}
    }
  }
  await sql`
    UPDATE companies SET
      logo_url = NULL,
      logo_crop_data = NULL
    WHERE id = ${companyId}
  `;

  revalidatePath("/settings");
  revalidatePath(`/company/${companyId}`);
  revalidatePath("/feed");
  revalidatePath("/messages");
  return { ok: true };
}

export async function deleteCompanyBanner(): Promise<Result> {
  const companyId = await requireCompanyId();
  const [row] = await sql`SELECT banner_url FROM companies WHERE id = ${companyId} LIMIT 1`;
  if (row?.banner_url) {
    const path = localUploadPath(row.banner_url);
    if (path) {
      try { await unlink(path); } catch {}
    }
  }
  await sql`
    UPDATE companies SET
      banner_url = NULL,
      banner_crop_data = NULL
    WHERE id = ${companyId}
  `;

  revalidatePath("/settings");
  revalidatePath(`/company/${companyId}`);
  return { ok: true };
}

export async function signIn(email: string, password: string): Promise<Result> {
  const e = email.trim().toLowerCase();
  if (!e || e.length > 254 || !password || password.length > 200) {
    return { ok: false, error: "Onjuist e-mailadres of wachtwoord." };
  }
  const attempts = await sql`
    SELECT locked_until FROM auth_login_attempts
    WHERE email = ${e} AND locked_until > now()
    LIMIT 1
  `;
  if (attempts.length > 0) {
    return { ok: false, error: "Te veel mislukte pogingen. Probeer het over 15 minuten opnieuw." };
  }
  const rows = await sql`
    SELECT id, password_hash, COALESCE(to_jsonb(users)->>'account_status', 'active') AS account_status
    FROM users WHERE email = ${e} LIMIT 1
  `;
  const passwordMatches = await verifyPassword(
    password,
    rows.length > 0 ? (rows[0].password_hash as string) : DUMMY_PASSWORD_HASH
  );
  const valid = rows.length > 0 && passwordMatches;
  if (!valid) {
    await sql`
      INSERT INTO auth_login_attempts (email, failed_count, first_failed_at, last_failed_at, locked_until)
      VALUES (${e}, 1, now(), now(), NULL)
      ON CONFLICT (email) DO UPDATE SET
        failed_count = CASE
          WHEN auth_login_attempts.first_failed_at < now() - interval '15 minutes' THEN 1
          ELSE auth_login_attempts.failed_count + 1
        END,
        first_failed_at = CASE
          WHEN auth_login_attempts.first_failed_at < now() - interval '15 minutes' THEN now()
          ELSE auth_login_attempts.first_failed_at
        END,
        last_failed_at = now(),
        locked_until = CASE
          WHEN auth_login_attempts.first_failed_at >= now() - interval '15 minutes'
            AND auth_login_attempts.failed_count + 1 >= 8
          THEN now() + interval '15 minutes'
          ELSE NULL
        END
    `;
    return { ok: false, error: "Onjuist e-mailadres of wachtwoord." };
  }
  if (rows[0].account_status === "suspended") return { ok: false, error: "Dit account is tijdelijk geschorst. Neem contact op met Vynta." };
  if (rows[0].account_status === "deactivated") return { ok: false, error: "Dit account is gedeactiveerd. Neem contact op met Vynta." };
  await sql`DELETE FROM auth_login_attempts WHERE email = ${e}`;
  await createSession(rows[0].id as string);
  return { ok: true };
}

export async function signOut(): Promise<void> {
  await destroySession();
}

/* ----------------------------- posts ----------------------------- */
export async function createPost(input: {
  type: PostType;
  body: string;
  quantity?: string;
  budget?: string;
  networkIds: string[];
  expiresDays?: number | null;
  attachments?: PostAttachment[];
  linkUrl?: string;
  linkData?: LinkPreviewData;
}): Promise<Result> {
  const companyId = await requireCompanyId();
  const cleanBody = sanitizeHtml(input.body.trim());
  if (!cleanBody.trim()) return { ok: false, error: "Beschrijving is verplicht." };
  if (input.networkIds.length === 0) return { ok: false, error: "Kies minimaal één netwerk." };

  const [me] = await sql`SELECT municipality_id, province, industry FROM companies WHERE id = ${companyId} LIMIT 1`;
  if (!me) return { ok: false, error: "Bedrijf niet gevonden." };

  const validIds = Array.from(new Set(input.networkIds));

  // expiresDays === null means "onbeperkt": store a far-future date since column is NOT NULL.
  const expiresAt =
    input.expiresDays == null
      ? new Date("2999-12-31T00:00:00Z")
      : new Date(Date.now() + input.expiresDays * 86400000);

  const linkData = input.linkData ? JSON.stringify(input.linkData) : null;
  const attachments = (input.attachments ?? []).map((a, i) => ({ ...a, position: i })).sort((a, b) => a.position - b.position);
  const firstImage = attachments.find((a) => a.type === "image")?.url;
  const firstVideo = attachments.find((a) => a.type === "video")?.url;
  const firstDoc = attachments.find((a) => a.type === "document")?.url;

  const [post] = await sql`
    INSERT INTO needs (
      company_id, type, body, quantity, budget,
      image_url, video_url, document_url, attachments, link_url, link_data,
      status, expires_at
    )
    VALUES (
      ${companyId}, ${input.type}, ${cleanBody},
      ${input.quantity || null}, ${input.budget || null},
      ${firstImage || null}, ${firstVideo || null}, ${firstDoc || null},
      ${JSON.stringify(attachments)},
      ${input.linkUrl || null}, ${linkData},
      'open', ${expiresAt}
    )
    RETURNING id`;
  for (const nid of validIds) {
    await sql`INSERT INTO post_networks (post_id, network_id)
      VALUES (${post.id}, ${nid}) ON CONFLICT DO NOTHING`;
  }

  const sortedAttachments = (input.attachments ?? [])
    .map((a, i) => ({ ...a, position: i }))
    .sort((a, b) => a.position - b.position);
  for (const [i, a] of sortedAttachments.entries()) {
    await sql`
      INSERT INTO post_attachments (
        post_id, file_url, file_type, mime_type, original_name,
        order_index, is_primary, width, height, duration
      )
      VALUES (
        ${post.id}, ${a.url}, ${a.type}, ${a.mimeType || null}, ${a.filename || null},
        ${i}, ${i === 0}, ${a.width || null}, ${a.height || null}, ${a.duration || null}
      )
    `;
  }

  revalidatePath("/feed");
  return { ok: true };
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0];
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtube-nocookie.com")) {
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2];
      return u.searchParams.get("v");
    }
  } catch {}
  return null;
}

export async function fetchLinkPreview(
  url: string
): Promise<Result & { preview?: LinkPreviewData }> {
  await requireCompanyId();
  try {
    new URL(url);
  } catch {
    return { ok: false, error: "Ongeldige URL." };
  }

  const ytId = extractYouTubeId(url);
  const fallback: LinkPreviewData | undefined = ytId
    ? {
        url,
        title: "YouTube-video",
        image: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
        provider: "YouTube",
      }
    : undefined;

  try {
    const res = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(url)}`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = (await res.json()) as {
        title?: string;
        description?: string;
        thumbnail_url?: string;
        html?: string;
        provider_name?: string;
        error?: string;
      };
      if (!data.error) {
        return {
          ok: true,
          preview: {
            url,
            title: data.title || fallback?.title || url,
            description: data.description,
            image: data.thumbnail_url || fallback?.image,
            html: data.html,
            provider: data.provider_name || fallback?.provider,
          },
        };
      }
    }
  } catch {
    // noembed kan soms falen; gebruik fallback
  }

  if (fallback) return { ok: true, preview: fallback };
  return { ok: false, error: "Kon geen preview ophalen voor deze link." };
}

/** @deprecated use createPost */
export const createNeed = createPost;

function localUploadPath(url: string): string | null {
  if (!url.startsWith("/uploads/")) return null;
  const decoded = decodeURIComponent(url);
  if (decoded.includes("..") || decoded.includes("\\")) return null;
  return join(process.cwd(), "public", decoded);
}

async function deleteUploadFiles(urls: (string | null | undefined)[]) {
  const { getStorageProvider } = await import("./storage");
  const provider = getStorageProvider();
  for (const url of urls) {
    if (!url) continue;
    // New-style storage URLs: delete via provider
    if (url.startsWith("/api/storage/")) {
      const key = url.replace("/api/storage/", "");
      try {
        await provider.delete(key);
      } catch {
        // best-effort
      }
      continue;
    }
    // Legacy local uploads: only delete in development
    if (process.env.NODE_ENV !== "production") {
      const path = localUploadPath(url);
      if (!path) continue;
      try {
        await unlink(path);
      } catch {
        // bestand was er misschien al niet meer
      }
    }
  }
}

export async function extendPost(
  postId: string,
  days: number | null
): Promise<Result> {
  const companyId = await requireCompanyId();
  const [post] = await sql`SELECT company_id FROM needs WHERE id = ${postId} LIMIT 1`;
  if (!post) return { ok: false, error: "Post niet gevonden." };
  if (post.company_id !== companyId) return { ok: false, error: "Je kunt alleen je eigen posts verlengen." };

  const expiresAt =
    days == null
      ? new Date("2999-12-31T00:00:00Z")
      : new Date(Date.now() + days * 86400000);

  await sql`UPDATE needs SET expires_at = ${expiresAt}, expiry_notified = false WHERE id = ${postId}`;
  revalidatePath("/feed");
  revalidatePath("/saved");
  return { ok: true };
}

export async function cleanupExpiredPosts(): Promise<number> {
  await requireCompanyId();
  const rows =
    await sql`SELECT id, image_url, video_url, document_url FROM needs WHERE expires_at < now()`;
  let deleted = 0;
  for (const r of rows) {
    await deleteUploadFiles(attachmentUrls(r as { attachments: PostAttachment[]; image_url: string | null; video_url: string | null; document_url: string | null }));
    await sql`DELETE FROM needs WHERE id = ${r.id as string}`;
    deleted++;
  }
  return deleted;
}

export async function notifyExpiringPosts(): Promise<number> {
  await requireCompanyId();
  const rows = await sql`
    SELECT id, company_id, body
    FROM needs
    WHERE expiry_notified = false
      AND expires_at > now()
      AND expires_at <= now() + interval '1 day'
  `;
  for (const r of rows) {
    const body = (r.body as string) ?? "";
    const summary = body.slice(0, 60) + (body.length > 60 ? "…" : "");
    await sql`
      INSERT INTO notifications (company_id, type, title, body, need_id)
      VALUES (
        ${r.company_id},
        'expiry',
        'Je post verloopt morgen',
        ${`"${summary}" verloopt morgen. Klik op je post om hem te verlengen.`},
        ${r.id}
      )
    `;
    await sql`UPDATE needs SET expiry_notified = true WHERE id = ${r.id}`;
  }
  return rows.length;
}

export async function toggleSave(needId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  const existing = await sql`SELECT 1 FROM saves WHERE company_id = ${companyId} AND need_id = ${needId}`;
  if (existing.length > 0) {
    await sql`DELETE FROM saves WHERE company_id = ${companyId} AND need_id = ${needId}`;
  } else {
    await sql`INSERT INTO saves (company_id, need_id) VALUES (${companyId}, ${needId}) ON CONFLICT DO NOTHING`;
  }
  revalidatePath("/feed");
  revalidatePath("/saved");
  return { ok: true };
}

export async function recordView(postId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  const [post] = await sql`SELECT company_id FROM needs WHERE id = ${postId} LIMIT 1`;
  if (!post) return { ok: false, error: "Post niet gevonden." };
  if ((post.company_id as string) === companyId) return { ok: true };

  const result = await sql`
    INSERT INTO post_views (post_id, company_id)
    VALUES (${postId}, ${companyId})
    ON CONFLICT (post_id, company_id) DO NOTHING
  `;

  if ((result as unknown as { count: number }).count > 0) {
    await sql`UPDATE needs SET views = views + 1 WHERE id = ${postId}`;
  }
  return { ok: true };
}

export async function toggleLike(needId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  const existing = await sql`SELECT 1 FROM post_reactions WHERE company_id = ${companyId} AND need_id = ${needId}`;
  if (existing.length > 0) {
    await sql`DELETE FROM post_reactions WHERE company_id = ${companyId} AND need_id = ${needId}`;
  } else {
    await sql`INSERT INTO post_reactions (company_id, need_id) VALUES (${companyId}, ${needId}) ON CONFLICT DO NOTHING`;
    const owner = await sql`SELECT company_id, body FROM needs WHERE id = ${needId} LIMIT 1`;
    if (owner.length > 0 && (owner[0].company_id as string) !== companyId) {
      const [me] = await sql`SELECT name FROM companies WHERE id = ${companyId}`;
      await sql`INSERT INTO notifications (company_id, type, title, body, actor_company_id, need_id)
        VALUES (${owner[0].company_id}, 'response', ${`${me.name} vindt je post leuk`}, ${(owner[0].body as string).slice(0, 60)}, ${companyId}, ${needId})`;
    }
  }
  revalidatePath("/feed");
  return { ok: true };
}

export async function addComment(needId: string, body: string): Promise<Result> {
  const companyId = await requireCompanyId();
  if (!body.trim()) return { ok: false, error: "Reactie is leeg." };
  await sql`INSERT INTO post_comments (need_id, company_id, body) VALUES (${needId}, ${companyId}, ${body.trim()})`;
  const owner = await sql`SELECT company_id, body FROM needs WHERE id = ${needId} LIMIT 1`;
  if (owner.length > 0 && (owner[0].company_id as string) !== companyId) {
    const [me] = await sql`SELECT name FROM companies WHERE id = ${companyId}`;
    await sql`INSERT INTO notifications (company_id, type, title, body, actor_company_id, need_id)
      VALUES (${owner[0].company_id}, 'response', ${`${me.name} reageerde op je post`}, ${body.trim().slice(0, 60)}, ${companyId}, ${needId})`;
  }
  revalidatePath("/feed");
  return { ok: true };
}

export async function getComments(needId: string): Promise<
  { id: string; companyId: string; companyName: string; logoColor: string; body: string; createdAt: string }[]
> {
  const rows = await sql`
    SELECT pc.id, pc.company_id, pc.body, pc.created_at, c.name, c.logo_color
    FROM post_comments pc
    JOIN companies c ON c.id = pc.company_id
    WHERE pc.need_id = ${needId}
    ORDER BY pc.created_at ASC`;
  return rows.map((r) => ({
    id: r.id as string,
    companyId: r.company_id as string,
    companyName: r.name as string,
    logoColor: r.logo_color as string,
    body: r.body as string,
    createdAt: new Date(r.created_at as string).toISOString(),
  }));
}

export async function toggleFollow(targetId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  if (companyId === targetId) return { ok: false, error: "Je kunt jezelf niet volgen." };
  const existing = await sql`SELECT 1 FROM follows WHERE follower_company_id = ${companyId} AND followee_company_id = ${targetId}`;
  if (existing.length > 0) {
    await sql`DELETE FROM follows WHERE follower_company_id = ${companyId} AND followee_company_id = ${targetId}`;
    await sql`UPDATE companies SET followers = GREATEST(followers - 1, 0) WHERE id = ${targetId}`;
  } else {
    await sql`INSERT INTO follows (follower_company_id, followee_company_id) VALUES (${companyId}, ${targetId}) ON CONFLICT DO NOTHING`;
    await sql`UPDATE companies SET followers = followers + 1 WHERE id = ${targetId}`;
    const [me] = await sql`SELECT name FROM companies WHERE id = ${companyId}`;
    await sql`INSERT INTO notifications (company_id, type, title, body, actor_company_id)
      VALUES (${targetId}, 'follow', ${`${me.name} volgt je nu`}, 'Je hebt een nieuwe volger.', ${companyId})`;
  }
  revalidatePath(`/company/${targetId}`);
  revalidatePath("/feed");
  return { ok: true };
}

export async function followNetwork(networkId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  await sql`
    INSERT INTO network_follows (company_id, network_id)
    VALUES (${companyId}, ${networkId})
    ON CONFLICT DO NOTHING
  `;
  revalidatePath("/networks");
  revalidatePath("/feed");
  return { ok: true };
}

export async function unfollowNetwork(networkId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  await sql`DELETE FROM network_follows WHERE company_id = ${companyId} AND network_id = ${networkId}`;
  revalidatePath("/networks");
  revalidatePath("/feed");
  return { ok: true };
}

export async function toggleNetworkFollow(networkId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  const existing = await sql`SELECT 1 FROM network_follows WHERE company_id = ${companyId} AND network_id = ${networkId} LIMIT 1`;
  if (existing.length > 0) {
    await sql`DELETE FROM network_follows WHERE company_id = ${companyId} AND network_id = ${networkId}`;
  } else {
    await sql`
      INSERT INTO network_follows (company_id, network_id)
      VALUES (${companyId}, ${networkId})
      ON CONFLICT DO NOTHING
    `;
  }
  revalidatePath("/networks");
  revalidatePath("/feed");
  return { ok: true };
}

export async function toggleNetworkMembership(networkId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  const existing = await sql`SELECT 1 FROM network_members WHERE company_id = ${companyId} AND network_id = ${networkId} LIMIT 1`;
  if (existing.length > 0) {
    await sql`DELETE FROM network_members WHERE company_id = ${companyId} AND network_id = ${networkId}`;
  } else {
    await sql`INSERT INTO network_members (company_id, network_id, origin) VALUES (${companyId}, ${networkId}, 'manual') ON CONFLICT DO NOTHING`;
  }
  revalidatePath("/networks");
  revalidatePath("/feed");
  return { ok: true };
}

/** @deprecated use toggleNetworkFollow or toggleNetworkMembership */
export async function toggleNetwork(networkId: string): Promise<Result> {
  return toggleNetworkFollow(networkId);
}

function attachmentUrls(post: { attachments?: PostAttachment[]; image_url?: string | null; video_url?: string | null; document_url?: string | null }): string[] {
  const urls = new Set<string>();
  if (post.attachments && Array.isArray(post.attachments)) {
    for (const a of post.attachments) {
      if (a?.url) urls.add(a.url);
    }
  }
  if (post.image_url) urls.add(post.image_url as string);
  if (post.video_url) urls.add(post.video_url as string);
  if (post.document_url) urls.add(post.document_url as string);
  return [...urls];
}

export async function deletePost(postId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  const [post] = await sql`SELECT company_id, image_url, video_url, document_url FROM needs WHERE id = ${postId} LIMIT 1`;
  if (!post) return { ok: false, error: "Post niet gevonden." };
  if (post.company_id !== companyId) return { ok: false, error: "Je kunt alleen je eigen posts verwijderen." };
  await deleteUploadFiles(attachmentUrls(post as { attachments: PostAttachment[]; image_url: string | null; video_url: string | null; document_url: string | null }));
  await sql`DELETE FROM needs WHERE id = ${postId}`;
  revalidatePath("/feed");
  revalidatePath("/saved");
  revalidatePath("/networks");
  return { ok: true };
}

export async function updatePost(
  postId: string,
  input: { body: string; quantity?: string; budget?: string }
): Promise<Result> {
  const companyId = await requireCompanyId();
  const cleanBody = sanitizeHtml(input.body.trim());
  if (!cleanBody.trim()) return { ok: false, error: "Tekst is verplicht." };
  const rows = await sql`SELECT company_id FROM needs WHERE id = ${postId} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Post niet gevonden." };
  if (rows[0].company_id !== companyId) return { ok: false, error: "Je kunt alleen je eigen posts bewerken." };
  await sql`
    UPDATE needs
    SET body = ${cleanBody}, quantity = ${input.quantity ?? null}, budget = ${input.budget ?? null}, updated_at = NOW()
    WHERE id = ${postId}
  `;
  revalidatePath("/feed");
  revalidatePath("/networks");
  return { ok: true };
}


/* ----------------------------- messaging ----------------------------- */
export async function respondToNeed(needId: string): Promise<{ ok: boolean; conversationId?: string; error?: string }> {
  const companyId = await requireCompanyId();
  const needRows = await sql`SELECT company_id, body FROM needs WHERE id = ${needId} LIMIT 1`;
  if (needRows.length === 0) return { ok: false, error: "Behoefte niet gevonden." };
  const ownerId = needRows[0].company_id as string;
  if (ownerId === companyId) return { ok: false, error: "Dit is je eigen behoefte." };

  // find existing conversation for this need between the two companies
  const existing = await sql`
    SELECT c.id FROM conversations c
    JOIN conversation_participants p1 ON p1.conversation_id = c.id AND p1.company_id = ${companyId}
    JOIN conversation_participants p2 ON p2.conversation_id = c.id AND p2.company_id = ${ownerId}
    WHERE c.need_id = ${needId} LIMIT 1`;
  let conversationId: string;
  if (existing.length > 0) {
    conversationId = existing[0].id as string;
  } else {
    const [conv] = await sql`INSERT INTO conversations (need_id) VALUES (${needId}) RETURNING id`;
    conversationId = conv.id as string;
    await sql`INSERT INTO conversation_participants (conversation_id, company_id) VALUES (${conversationId}, ${companyId})`;
    await sql`INSERT INTO conversation_participants (conversation_id, company_id) VALUES (${conversationId}, ${ownerId})`;
    await sql`UPDATE needs SET responses = responses + 1, status = 'in_conversation' WHERE id = ${needId}`;
    const [me] = await sql`SELECT name FROM companies WHERE id = ${companyId}`;
    await sql`INSERT INTO notifications (company_id, type, title, body, actor_company_id, need_id)
      VALUES (${ownerId}, 'response', ${`${me.name} reageerde`}, ${`op je behoefte “${(needRows[0].body as string).slice(0, 60)}…”`}, ${companyId}, ${needId})`;
  }
  revalidatePath("/feed");
  revalidatePath("/messages");
  return { ok: true, conversationId };
}

export async function sendMessage(
  conversationId: string,
  input: { kind?: "text" | "image" | "video" | "document" | "voice" | "location" | "card" | "system"; body: string; meta?: string }
): Promise<Result & { id?: string }> {
  const companyId = await requireCompanyId();
  if (!input.body.trim() && !input.meta) return { ok: false, error: "Leeg bericht." };
  const member = await sql`SELECT 1 FROM conversation_participants WHERE conversation_id = ${conversationId} AND company_id = ${companyId}`;
  if (member.length === 0) return { ok: false, error: "Geen toegang tot dit gesprek." };

  // Check if the other participant has blocked this company
  const otherParticipant = await sql`SELECT company_id FROM conversation_participants WHERE conversation_id = ${conversationId} AND company_id <> ${companyId} LIMIT 1`;
  if (otherParticipant.length > 0) {
    const otherId = otherParticipant[0].company_id as string;
    const blocked = await sql`SELECT 1 FROM chat_blocks WHERE blocker_id = ${otherId} AND blocked_id = ${companyId} LIMIT 1`;
    if (blocked.length > 0) return { ok: false, error: "Dit contact heeft je geblokkeerd." };
  }

  const kind = input.kind ?? "text";
  const caption = input.body.trim();
  const [row] = await sql`
    INSERT INTO messages (conversation_id, sender_company_id, kind, body, meta, status)
    VALUES (${conversationId}, ${companyId}, ${kind}, ${caption}, ${input.meta ?? null}, 'sent')
    RETURNING id
  `;
  await sql`UPDATE conversation_participants SET last_read_at = now()
    WHERE conversation_id = ${conversationId} AND company_id = ${companyId}`;

  // notify the other participant
  const others = await sql`SELECT company_id FROM conversation_participants
    WHERE conversation_id = ${conversationId} AND company_id <> ${companyId}`;
  const [me] = await sql`SELECT name FROM companies WHERE id = ${companyId}`;
  const preview = input.meta ? "Bijlage" : input.body.trim().slice(0, 60);
  for (const o of others) {
    await sql`INSERT INTO notifications (company_id, type, title, body, actor_company_id)
      VALUES (${o.company_id}, 'response', ${`Nieuw bericht van ${me.name}`}, ${preview}, ${companyId})`;
  }
  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  return { ok: true, id: row.id as string };
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const companyId = await requireCompanyId();
  const members = await sql`
    UPDATE conversation_participants SET last_read_at = now()
    WHERE conversation_id = ${conversationId} AND company_id = ${companyId}
    RETURNING conversation_id
  `;
  if (members.length === 0) return;
  await sql`
    UPDATE messages SET status = 'read', read_at = now()
    WHERE conversation_id = ${conversationId}
      AND sender_company_id <> ${companyId}
      AND status <> 'read'
  `;
  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
}

export async function markAllNotificationsRead(): Promise<void> {
  const session = await getSession();
  if (!session) return;
  await sql`UPDATE notifications SET read = true WHERE company_id = ${session.company.id}`;
  revalidatePath("/notifications");
}

/* ---------------- drafts ---------------- */

export async function saveDraft(input: DraftData): Promise<Result & { id?: string }> {
  const companyId = await requireCompanyId();
  const safeInput = input.body
    ? { ...input, body: sanitizeHtml(input.body) }
    : input;
  const data = JSON.stringify(safeInput);
  // Keep one auto-saved draft per company by deleting previous ones
  await sql`DELETE FROM drafts WHERE company_id = ${companyId}`;
  const [row] = await sql`
    INSERT INTO drafts (company_id, data)
    VALUES (${companyId}, ${data})
    RETURNING id`;
  return { ok: true, id: row.id as string };
}

export async function getDrafts(): Promise<Draft[]> {
  const companyId = await requireCompanyId();
  const rows = await sql`
    SELECT id, company_id, data, created_at, updated_at
    FROM drafts
    WHERE company_id = ${companyId}
    ORDER BY updated_at DESC`;
  return rows.map((r) => ({
    id: r.id as string,
    companyId: r.company_id as string,
    data: r.data as DraftData,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  }));
}

export async function deleteDraft(draftId?: string): Promise<Result> {
  const companyId = await requireCompanyId();
  if (draftId) {
    await sql`DELETE FROM drafts WHERE id = ${draftId} AND company_id = ${companyId}`;
  } else {
    await sql`DELETE FROM drafts WHERE company_id = ${companyId}`;
  }
  return { ok: true };
}

/* ---------------- calls ---------------- */

async function getOtherParticipant(conversationId: string, companyId: string): Promise<string | null> {
  const rows = await sql`
    SELECT other.company_id
    FROM conversation_participants other
    WHERE other.conversation_id = ${conversationId}
      AND other.company_id <> ${companyId}
      AND EXISTS (
        SELECT 1 FROM conversation_participants mine
        WHERE mine.conversation_id = ${conversationId}
          AND mine.company_id = ${companyId}
      )
    LIMIT 1
  `;
  return (rows[0]?.company_id as string) ?? null;
}

export async function startCall(conversationId: string, kind: "audio" | "video"): Promise<Result & { id?: string }> {
  const companyId = await requireCompanyId();
  const otherId = await getOtherParticipant(conversationId, companyId);
  if (!otherId) return { ok: false, error: "Geen gesprekspartner gevonden." };

  // Check block status in both directions
  const blockRows = await sql`SELECT 1 FROM chat_blocks WHERE (blocker_id = ${companyId} AND blocked_id = ${otherId}) OR (blocker_id = ${otherId} AND blocked_id = ${companyId}) LIMIT 1`;
  if (blockRows.length > 0) return { ok: false, error: "Dit contact is geblokkeerd." };

  const [existing] = await sql`
    SELECT id FROM calls
    WHERE conversation_id = ${conversationId}
      AND status IN ('calling', 'connected')
      AND (caller_id = ${companyId} OR callee_id = ${companyId})
    LIMIT 1
  `;
  if (existing) return { ok: false, error: "Er loopt al een oproep." };

  const [call] = await sql`
    INSERT INTO calls (conversation_id, caller_id, callee_id, kind, status)
    VALUES (${conversationId}, ${companyId}, ${otherId}, ${kind}, 'calling')
    RETURNING id
  `;
  return { ok: true, id: call.id as string };
}

export async function acceptCall(callId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  const [call] = await sql`
    UPDATE calls SET status = 'connected'
    WHERE id = ${callId} AND callee_id = ${companyId} AND status = 'calling'
    RETURNING id
  `;
  if (!call) return { ok: false, error: "Oproep niet gevonden of al beantwoord." };
  return { ok: true };
}

export async function declineCall(callId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  const [call] = await sql`
    UPDATE calls SET status = 'declined', ended_at = now()
    WHERE id = ${callId} AND callee_id = ${companyId} AND status = 'calling'
    RETURNING id, conversation_id, kind
  `;
  if (!call) return { ok: false, error: "Oproep niet gevonden." };
  await logCallEvent(call.conversation_id as string, call.kind as "audio" | "video", "Oproep geweigerd", companyId);
  return { ok: true };
}

export async function endCall(callId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  const [call] = await sql`
    SELECT id, started_at, status, conversation_id, kind FROM calls
    WHERE id = ${callId} AND (caller_id = ${companyId} OR callee_id = ${companyId})
    LIMIT 1
  `;
  if (!call) return { ok: false, error: "Oproep niet gevonden." };

  const durationMs =
    call.status === "connected"
      ? Date.now() - new Date(call.started_at as string).getTime()
      : 0;
  await sql`
    UPDATE calls SET status = 'ended', ended_at = now(), duration_ms = ${durationMs}
    WHERE id = ${callId}
  `;
  const body =
    durationMs > 0
      ? `${(call.kind as string) === "video" ? "Videogesprek" : "Audiogesprek"} van ${formatDurationMs(durationMs)}`
      : `${(call.kind as string) === "video" ? "Gemiste video-oproep" : "Gemiste audio-oproep"}`;
  await logCallEvent(call.conversation_id as string, call.kind as "audio" | "video", body, companyId);
  return { ok: true };
}

async function logCallEvent(
  conversationId: string,
  kind: "audio" | "video",
  body: string,
  senderCompanyId: string
) {
  await sql`
    INSERT INTO messages (conversation_id, sender_company_id, kind, body, status)
    VALUES (${conversationId}, ${senderCompanyId}, 'system', ${body}, 'sent')
  `;
  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
}

function formatDurationMs(ms: number) {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} seconde${seconds === 1 ? "" : "n"}`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (remainder === 0) return `${minutes} minuut${minutes === 1 ? "" : "en"}`;
  return `${minutes} minuut${minutes === 1 ? "" : "en"} ${remainder} seconde${remainder === 1 ? "" : "n"}`;
}

export async function getActiveCall(conversationId: string): Promise<
  { id: string; kind: "audio" | "video"; status: string; callerId: string; calleeId: string } | null
> {
  const companyId = await requireCompanyId();
  const rows = await sql`
    SELECT id, kind, status, caller_id, callee_id FROM calls
    WHERE conversation_id = ${conversationId}
      AND status IN ('calling', 'connected')
      AND (caller_id = ${companyId} OR callee_id = ${companyId})
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id as string,
    kind: r.kind as "audio" | "video",
    status: r.status as string,
    callerId: r.caller_id as string,
    calleeId: r.callee_id as string,
  };
}

export async function sendSignal(
  callId: string,
  type: "offer" | "answer" | "ice-candidate" | "hangup",
  payload: unknown
): Promise<Result> {
  const companyId = await requireCompanyId();
  const [call] = await sql`
    SELECT caller_id, callee_id FROM calls
    WHERE id = ${callId} AND (caller_id = ${companyId} OR callee_id = ${companyId})
    LIMIT 1
  `;
  if (!call) return { ok: false, error: "Oproep niet gevonden." };
  const receiverId = (call.caller_id as string) === companyId ? (call.callee_id as string) : (call.caller_id as string);
  const serializedPayload = JSON.parse(JSON.stringify(payload)) as postgres.JSONValue;
  await sql`
    INSERT INTO call_signals (call_id, sender_id, receiver_id, type, payload)
    VALUES (${callId}, ${companyId}, ${receiverId}, ${type}, ${sql.json(serializedPayload)})
  `;
  return { ok: true };
}

export async function pollSignals(
  callId: string,
  after?: string
): Promise<{ type: string; payload: unknown; id: string }[]> {
  const companyId = await requireCompanyId();
  const afterClause = after
    ? sql`AND created_at > (SELECT created_at FROM call_signals WHERE id = ${after})`
    : sql``;
  const rows = await sql`
    SELECT id, type, payload FROM call_signals
    WHERE call_id = ${callId} AND receiver_id = ${companyId}
    ${afterClause}
    ORDER BY created_at ASC
    LIMIT 50
  `;
  return rows.map((r) => ({
    id: r.id as string,
    type: r.type as string,
    payload: r.payload as unknown,
  }));
}

/* ----------------------- chat management ----------------------- */

export async function archiveChat(conversationId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  const member = await sql`SELECT 1 FROM conversation_participants WHERE conversation_id = ${conversationId} AND company_id = ${companyId}`;
  if (member.length === 0) return { ok: false, error: "Geen toegang tot dit gesprek." };
  await sql`
    INSERT INTO archived_chats (conversation_id, company_id)
    VALUES (${conversationId}, ${companyId})
    ON CONFLICT (conversation_id, company_id) DO NOTHING
  `;
  revalidatePath("/messages");
  return { ok: true };
}

export async function unarchiveChat(conversationId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  await sql`DELETE FROM archived_chats WHERE conversation_id = ${conversationId} AND company_id = ${companyId}`;
  revalidatePath("/messages");
  return { ok: true };
}

export async function muteChat(
  conversationId: string,
  duration: "1h" | "8h" | "24h" | "7d" | "30d" | "indefinite"
): Promise<Result> {
  const companyId = await requireCompanyId();
  const member = await sql`SELECT 1 FROM conversation_participants WHERE conversation_id = ${conversationId} AND company_id = ${companyId}`;
  if (member.length === 0) return { ok: false, error: "Geen toegang tot dit gesprek." };

  const indefinite = duration === "indefinite";
  const hours = { "1h": 1, "8h": 8, "24h": 24, "7d": 168, "30d": 720 } as const;
  const mutedUntil = indefinite ? null : new Date(Date.now() + hours[duration as keyof typeof hours] * 3600_000).toISOString();

  await sql`
    INSERT INTO chat_mutes (conversation_id, company_id, muted_until, mute_indefinitely)
    VALUES (${conversationId}, ${companyId}, ${mutedUntil}, ${indefinite})
    ON CONFLICT (conversation_id, company_id)
    DO UPDATE SET muted_until = ${mutedUntil}, mute_indefinitely = ${indefinite}, updated_at = now()
  `;
  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
  return { ok: true };
}

export async function unmuteChat(conversationId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  await sql`DELETE FROM chat_mutes WHERE conversation_id = ${conversationId} AND company_id = ${companyId}`;
  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
  return { ok: true };
}

export async function getChatMuteStatus(conversationId: string): Promise<{
  muted: boolean;
  mutedUntil?: string | null;
  indefinite: boolean;
}> {
  const companyId = await requireCompanyId();
  const rows = await sql`
    SELECT muted_until, mute_indefinitely FROM chat_mutes
    WHERE conversation_id = ${conversationId} AND company_id = ${companyId}
  `;
  if (rows.length === 0) return { muted: false, indefinite: false };
  const r = rows[0];
  const indefinite = r.mute_indefinitely as boolean;
  const mutedUntil = r.muted_until ? new Date(r.muted_until as string).toISOString() : null;
  if (indefinite) return { muted: true, mutedUntil: null, indefinite: true };
  if (mutedUntil && new Date(mutedUntil).getTime() > Date.now()) {
    return { muted: true, mutedUntil, indefinite: false };
  }
  return { muted: false, indefinite: false };
}

export async function blockContact(companyIdToBlock: string): Promise<Result> {
  const companyId = await requireCompanyId();
  if (companyIdToBlock === companyId) return { ok: false, error: "Je kunt jezelf niet blokkeren." };
  await sql`
    INSERT INTO chat_blocks (blocker_id, blocked_id)
    VALUES (${companyId}, ${companyIdToBlock})
    ON CONFLICT (blocker_id, blocked_id) DO NOTHING
  `;
  revalidatePath("/messages");
  return { ok: true };
}

export async function unblockContact(companyIdToUnblock: string): Promise<Result> {
  const companyId = await requireCompanyId();
  await sql`DELETE FROM chat_blocks WHERE blocker_id = ${companyId} AND blocked_id = ${companyIdToUnblock}`;
  revalidatePath("/messages");
  return { ok: true };
}

export async function isContactBlocked(otherCompanyId: string): Promise<boolean> {
  const companyId = await requireCompanyId();
  const rows = await sql`SELECT 1 FROM chat_blocks WHERE blocker_id = ${companyId} AND blocked_id = ${otherCompanyId} LIMIT 1`;
  return rows.length > 0;
}

export async function reportContact(input: {
  reportedId: string;
  conversationId?: string;
  reason: "spam" | "misleiding" | "intimidatie" | "ongepast" | "verdacht" | "fraude" | "anders";
  details?: string;
  includeMessages?: boolean;
}): Promise<Result> {
  const companyId = await requireCompanyId();
  if (input.reportedId === companyId) return { ok: false, error: "Je kunt jezelf niet rapporteren." };
  const reported = await sql`SELECT 1 FROM companies WHERE id = ${input.reportedId} LIMIT 1`;
  if (reported.length === 0) return { ok: false, error: "Bedrijf niet gevonden." };
  if (input.conversationId) {
    const participants = await sql`
      SELECT company_id FROM conversation_participants
      WHERE conversation_id = ${input.conversationId}
        AND company_id IN (${companyId}, ${input.reportedId})
    `;
    if (participants.length !== 2) return { ok: false, error: "Geen toegang tot dit gesprek." };
  }
  const duplicate = await sql`
    SELECT 1 FROM chat_reports
    WHERE reporter_id = ${companyId}
      AND reported_id = ${input.reportedId}
      AND status = 'open'
      AND conversation_id IS NOT DISTINCT FROM ${input.conversationId ?? null}
    LIMIT 1
  `;
  if (duplicate.length > 0) return { ok: false, error: "Je hebt dit contact al gerapporteerd." };
  const inserted = await sql`
    INSERT INTO chat_reports (reporter_id, reported_id, conversation_id, reason, details, include_messages)
    VALUES (${companyId}, ${input.reportedId}, ${input.conversationId ?? null}, ${input.reason}, ${input.details ?? null}, ${input.includeMessages ?? false})
    ON CONFLICT DO NOTHING
    RETURNING id
  `;
  if (inserted.length === 0) return { ok: false, error: "Je hebt dit contact al gerapporteerd." };
  return { ok: true };
}

/* ----------------------------- message actions ----------------------------- */

export async function deleteMessageForMe(messageIds: string[]): Promise<Result> {
  const companyId = await requireCompanyId();
  for (const msgId of messageIds) {
    await sql`
      INSERT INTO message_visibility (message_id, user_id)
      SELECT m.id, ${companyId}
      FROM messages m
      JOIN conversation_participants p ON p.conversation_id = m.conversation_id
      WHERE m.id = ${msgId} AND p.company_id = ${companyId}
      ON CONFLICT (message_id, user_id) DO NOTHING
    `;
  }
  revalidatePath("/messages");
  return { ok: true };
}

export async function deleteMessageForEveryone(messageIds: string[]): Promise<Result> {
  const companyId = await requireCompanyId();
  for (const msgId of messageIds) {
    const rows = await sql`
      SELECT sender_company_id, created_at FROM messages WHERE id = ${msgId}
    `;
    if (rows.length === 0) continue;
    const senderId = rows[0].sender_company_id as string;
    const createdAt = new Date(rows[0].created_at as string);
    if (senderId !== companyId) return { ok: false, error: "Je kunt alleen je eigen berichten voor iedereen verwijderen." };
    const hoursSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince > 24) return { ok: false, error: "Berichten kunnen alleen binnen 24 uur voor iedereen worden verwijderd." };
    await sql`
      UPDATE messages
      SET deleted_for_everyone = true,
          deleted_for_everyone_at = NOW(),
          deleted_by_user_id = ${companyId},
          body = 'Dit bericht is verwijderd',
          meta = NULL
      WHERE id = ${msgId} AND sender_company_id = ${companyId}
    `;
  }
  revalidatePath("/messages");
  return { ok: true };
}

export async function forwardMessages(input: {
  messageIds: string[];
  targetConversationIds: string[];
}): Promise<Result & { forwardedIds?: string[] }> {
  const companyId = await requireCompanyId();
  const forwardedIds: string[] = [];

  for (const targetConvId of input.targetConversationIds) {
    const member = await sql`SELECT 1 FROM conversation_participants WHERE conversation_id = ${targetConvId} AND company_id = ${companyId}`;
    if (member.length === 0) continue;

    for (const msgId of input.messageIds) {
      const rows = await sql`
        SELECT m.* FROM messages m
        JOIN conversation_participants p ON p.conversation_id = m.conversation_id
        WHERE m.id = ${msgId} AND p.company_id = ${companyId}
        LIMIT 1
      `;
      if (rows.length === 0) continue;
      const orig = rows[0];
      const [newRow] = await sql`
        INSERT INTO messages (conversation_id, sender_company_id, kind, body, meta, status,
          forwarded_from_message_id, forwarded_by_user_id, forwarded_at)
        VALUES (${targetConvId}, ${companyId}, ${orig.kind}, ${orig.body}, ${orig.meta ?? null}, 'sent',
          ${msgId}, ${companyId}, NOW())
        RETURNING id
      `;
      forwardedIds.push(newRow.id as string);
    }

    const others = await sql`SELECT company_id FROM conversation_participants WHERE conversation_id = ${targetConvId} AND company_id <> ${companyId}`;
    const [me] = await sql`SELECT name FROM companies WHERE id = ${companyId}`;
    for (const o of others) {
      await sql`INSERT INTO notifications (company_id, type, title, body, actor_company_id)
        VALUES (${o.company_id}, 'response', ${`Nieuw bericht van ${me.name}`}, 'Doorgestuurd bericht', ${companyId})`;
    }
  }
  revalidatePath("/messages");
  return { ok: true, forwardedIds };
}

export async function pinMessage(input: {
  conversationId: string;
  messageId: string;
  durationDays: 1 | 3 | 7 | 30;
}): Promise<Result> {
  const companyId = await requireCompanyId();
  const member = await sql`SELECT 1 FROM conversation_participants WHERE conversation_id = ${input.conversationId} AND company_id = ${companyId}`;
  if (member.length === 0) return { ok: false, error: "Geen toegang tot dit gesprek." };
  const message = await sql`
    SELECT 1 FROM messages
    WHERE id = ${input.messageId} AND conversation_id = ${input.conversationId}
    LIMIT 1
  `;
  if (message.length === 0) return { ok: false, error: "Bericht niet gevonden in dit gesprek." };

  const active = await sql`
    SELECT id FROM pinned_messages
    WHERE conversation_id = ${input.conversationId} AND pinned_until > NOW()
  `;
  if (active.length >= 3) return { ok: false, error: "Maximum bereikt" };

  const until = new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000);
  await sql`
    INSERT INTO pinned_messages (conversation_id, message_id, pinned_by_user_id, pinned_until)
    VALUES (${input.conversationId}, ${input.messageId}, ${companyId}, ${until})
    ON CONFLICT (conversation_id, message_id)
    DO UPDATE SET pinned_until = ${until}, pinned_at = NOW(), pinned_by_user_id = ${companyId}
  `;
  revalidatePath(`/messages/${input.conversationId}`);
  return { ok: true };
}

export async function unpinMessage(conversationId: string, messageId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  await sql`
    DELETE FROM pinned_messages
    WHERE conversation_id = ${conversationId}
      AND message_id = ${messageId}
      AND EXISTS (
        SELECT 1
        FROM conversation_participants
        WHERE conversation_id = ${conversationId}
          AND company_id = ${companyId}
      )
  `;
  revalidatePath(`/messages/${conversationId}`);
  return { ok: true };
}

export async function getPinnedMessages(conversationId: string): Promise<Array<{
  messageId: string;
  pinnedAt: string;
  pinnedUntil: string;
  pinnedBy: string;
}>> {
  const companyId = await requireCompanyId();
  const member = await sql`SELECT 1 FROM conversation_participants WHERE conversation_id = ${conversationId} AND company_id = ${companyId}`;
  if (member.length === 0) return [];
  const rows = await sql`
    SELECT message_id, pinned_at, pinned_until, pinned_by_user_id
    FROM pinned_messages
    WHERE conversation_id = ${conversationId} AND pinned_until > NOW()
    ORDER BY pinned_at DESC
    LIMIT 3
  `;
  return rows.map((r) => ({
    messageId: r.message_id as string,
    pinnedAt: new Date(r.pinned_at as string).toISOString(),
    pinnedUntil: new Date(r.pinned_until as string).toISOString(),
    pinnedBy: r.pinned_by_user_id as string,
  }));
}
