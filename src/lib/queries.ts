import "server-only";
import { sql } from "./db";
import { sanitizeHtml } from "./rich-text";
import type {
  Company,
  Post,
  PostAttachment,
  Network,
  Conversation,
  Message,
  AppNotification,
  PostType,
  NetworkType,
  NotificationType,
  LinkPreviewData,
} from "./types";

/* ----------------------------- mappers ----------------------------- */
type Row = Record<string, unknown>;

function mapCompany(r: Row, networks: string[] = []): Company {
  return {
    id: r.id as string,
    name: r.name as string,
    handle: r.handle as string,
    logoColor: r.logo_color as string,
    industry: r.industry as string,
    city: r.city as string,
    province: (r.province as string) ?? "",
    country: r.country as string,
    municipality: (r.municipality as string) ?? undefined,
    municipalityId: (r.municipality_id as string) ?? undefined,
    address: (r.address as string) ?? undefined,
    postcode: (r.postcode as string) ?? undefined,
    description: (r.description as string) ?? undefined,
    website: (r.website as string) ?? undefined,
    phone: (r.phone as string) ?? undefined,
    email: (r.email as string) ?? undefined,
    kvkNumber: (r.kvk_number as string) ?? undefined,
    vatNumber: (r.vat_number as string) ?? undefined,
    logoUrl: (r.logo_url as string) ?? undefined,
    bannerUrl: (r.banner_url as string) ?? undefined,
    bannerCropData: (r.banner_crop_data as { x: number; y: number; zoom: number } | null) ?? undefined,
    logoCropData: (r.logo_crop_data as { x: number; y: number; zoom: number } | null) ?? undefined,
    verified: r.verified as boolean,
    rating: Number(r.rating),
    ratingCount: r.rating_count as number,
    followers: r.followers as number,
    following: 0,
    memberSince: new Date(r.created_at as string).toISOString(),
    products: [],
    networks,
  };
}

async function attachmentsForPosts(ids: string[]): Promise<Map<string, PostAttachment[]>> {
  const map = new Map<string, PostAttachment[]>();
  if (ids.length === 0) return map;
  const rows = await sql`
    SELECT * FROM post_attachments
    WHERE post_id IN ${sql(ids)}
    ORDER BY post_id, order_index ASC, created_at ASC
  `;
  for (const r of rows) {
    const pid = r.post_id as string;
    if (!map.has(pid)) map.set(pid, []);
    map.get(pid)!.push(mapAttachment(r));
  }
  return map;
}

function mapAttachment(r: Row): PostAttachment {
  return {
    id: r.id as string,
    type: r.file_type as PostAttachment["type"],
    url: r.file_url as string,
    filename: (r.original_name as string) || undefined,
    position: (r.order_index as number) ?? 0,
    mimeType: (r.mime_type as string) || undefined,
    width: (r.width as number) ?? undefined,
    height: (r.height as number) ?? undefined,
    duration: (r.duration as number) ?? undefined,
    isPrimary: (r.is_primary as boolean) ?? false,
  };
}

function mapPost(
  r: Row,
  networks: string[],
  attachments: PostAttachment[],
  opts: { saved: boolean; liked: boolean; reactions: number; comments: number }
): Post {
  const sorted = [...attachments].sort((a, b) => a.position - b.position);
  return {
    id: r.id as string,
    companyId: r.company_id as string,
    type: r.type as PostType,
    body: sanitizeHtml(r.body as string),
    quantity: (r.quantity as string) ?? undefined,
    budget: (r.budget as string) ?? undefined,
    imageUrl: (r.image_url as string) || undefined,
    videoUrl: (r.video_url as string) || undefined,
    documentUrl: (r.document_url as string) || undefined,
    attachments: sorted,
    linkUrl: (r.link_url as string) || undefined,
    linkData: (r.link_data as LinkPreviewData) || undefined,
    networks,
    status: r.status as Post["status"],
    reactions: opts.reactions,
    comments: opts.comments,
    views: r.views as number,
    saved: opts.saved,
    liked: opts.liked,
    createdAt: new Date(r.created_at as string).toISOString(),
    expiresAt: r.expires_at ? new Date(r.expires_at as string).toISOString() : undefined,
  };
}

async function networksForPosts(ids: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (ids.length === 0) return map;
  const rows = await sql`SELECT post_id, network_id FROM post_networks WHERE post_id IN ${sql(ids)}`;
  for (const row of rows) {
    const pid = row.post_id as string;
    if (!map.has(pid)) map.set(pid, []);
    map.get(pid)!.push(row.network_id as string);
  }
  return map;
}

async function socialCounts(
  ids: string[],
  viewerId: string
): Promise<Map<string, { reactions: number; comments: number; liked: boolean }>> {
  const map = new Map<string, { reactions: number; comments: number; liked: boolean }>();
  for (const id of ids) map.set(id, { reactions: 0, comments: 0, liked: false });
  if (ids.length === 0) return map;
  const [reactionRows, commentRows, myLikes] = await Promise.all([
    sql`SELECT need_id, count(*)::int AS n FROM post_reactions WHERE need_id IN ${sql(ids)} GROUP BY need_id`,
    sql`SELECT need_id, count(*)::int AS n FROM post_comments WHERE need_id IN ${sql(ids)} GROUP BY need_id`,
    sql`SELECT need_id FROM post_reactions WHERE need_id IN ${sql(ids)} AND company_id = ${viewerId}`,
  ]);
  for (const r of reactionRows) {
    const entry = map.get(r.need_id as string);
    if (entry) entry.reactions = r.n as number;
  }
  for (const r of commentRows) {
    const entry = map.get(r.need_id as string);
    if (entry) entry.comments = r.n as number;
  }
  for (const r of myLikes) {
    const entry = map.get(r.need_id as string);
    if (entry) entry.liked = true;
  }
  return map;
}

/* ----------------------------- companies ----------------------------- */
export async function getCompanyById(id: string): Promise<Company | null> {
  const rows = await sql`SELECT * FROM companies WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return null;
  const nets = await sql`SELECT network_id FROM network_members WHERE company_id = ${id}`;
  const products = await sql`SELECT id, name, description FROM products WHERE company_id = ${id}`;
  const company = mapCompany(rows[0], nets.map((n) => n.network_id as string));
  company.products = products.map((p) => ({
    id: p.id as string,
    name: p.name as string,
    description: p.description as string,
  }));
  return company;
}

export async function searchCompanies(q: string): Promise<Company[]> {
  const term = `%${q.toLowerCase()}%`;
  const rows = q
    ? await sql`SELECT * FROM companies
        WHERE lower(name) LIKE ${term} OR lower(industry) LIKE ${term}
           OR lower(country) LIKE ${term} OR lower(city) LIKE ${term}
           OR lower(description) LIKE ${term}
        ORDER BY verified DESC, followers DESC`
    : await sql`SELECT * FROM companies ORDER BY verified DESC, followers DESC`;
  return rows.map((r) => mapCompany(r));
}

/* ----------------------------- posts ----------------------------- */
async function savedSet(companyId: string): Promise<Set<string>> {
  const rows = await sql`SELECT need_id FROM saves WHERE company_id = ${companyId}`;
  return new Set(rows.map((r) => r.need_id as string));
}

export async function getSavedIds(companyId: string): Promise<string[]> {
  return [...(await savedSet(companyId))];
}

export async function getSavedPosts(companyId: string): Promise<Post[]> {
  const rows = await sql`
    SELECT n.* FROM needs n
    JOIN saves s ON s.need_id = n.id
    WHERE s.company_id = ${companyId}
    ORDER BY n.created_at DESC
    LIMIT 100
  `;
  const ids = rows.map((r) => r.id as string);
  const [nets, social, saved] = await Promise.all([
    networksForPosts(ids),
    socialCounts(ids, companyId),
    savedSet(companyId),
  ]);
  return applyPostMapping(rows, nets, social, saved);
}

export async function getFollowingIds(companyId: string): Promise<string[]> {
  const rows = await sql`SELECT followee_company_id FROM follows WHERE follower_company_id = ${companyId}`;
  return rows.map((r) => r.followee_company_id as string);
}

export async function getFollowedCompanies(companyId: string): Promise<Company[]> {
  const rows = await sql`
    SELECT c.* FROM companies c
    JOIN follows f ON f.followee_company_id = c.id
    WHERE f.follower_company_id = ${companyId}
    ORDER BY c.name
  `;
  return rows.map((r) => mapCompany(r));
}

async function applyPostMapping(
  rows: Row[],
  nets: Map<string, string[]>,
  social: Map<string, { reactions: number; comments: number; liked: boolean }>,
  saved: Set<string>
): Promise<Post[]> {
  const ids = rows.map((r) => r.id as string);
  const atts = await attachmentsForPosts(ids);
  return rows.map((r) => {
    const id = r.id as string;
    const s = social.get(id) ?? { reactions: 0, comments: 0, liked: false };
    return mapPost(r, nets.get(id) ?? [], atts.get(id) ?? [], { saved: saved.has(id), liked: s.liked, reactions: s.reactions, comments: s.comments });
  });
}

export async function getFeed(companyId: string): Promise<Post[]> {
  const rows = await sql`
    WITH visible AS (
      SELECT DISTINCT pn.post_id AS id
      FROM post_networks pn
      WHERE pn.network_id IN (
        SELECT network_id FROM network_members WHERE company_id = ${companyId}
        UNION
        SELECT network_id FROM network_follows WHERE company_id = ${companyId}
      )
    )
    SELECT n.* FROM needs n
    WHERE n.id IN (SELECT id FROM visible)
       OR n.company_id = ${companyId}
    ORDER BY n.created_at DESC
    LIMIT 100
  `;
  const ids = rows.map((r) => r.id as string);
  const [nets, social, saved] = await Promise.all([
    networksForPosts(ids),
    socialCounts(ids, companyId),
    savedSet(companyId),
  ]);
  return applyPostMapping(rows, nets, social, saved);
}

export async function getPostsByCompany(profileId: string, viewerId: string): Promise<Post[]> {
  const rows = await sql`SELECT * FROM needs WHERE company_id = ${profileId} ORDER BY created_at DESC`;
  const ids = rows.map((r) => r.id as string);
  const [nets, social, saved] = await Promise.all([
    networksForPosts(ids),
    socialCounts(ids, viewerId),
    savedSet(viewerId),
  ]);
  return applyPostMapping(rows, nets, social, saved);
}

/** @deprecated use getPostsByCompany */
export const getNeedsByCompany = getPostsByCompany;

export async function getPostsByNetwork(networkId: string, viewerId: string): Promise<Post[]> {
  const rows = await sql`
    SELECT n.* FROM needs n
    JOIN post_networks pn ON pn.post_id = n.id
    WHERE pn.network_id = ${networkId}
    ORDER BY n.created_at DESC`;
  const ids = rows.map((r) => r.id as string);
  const [nets, social, saved] = await Promise.all([
    networksForPosts(ids),
    socialCounts(ids, viewerId),
    savedSet(viewerId),
  ]);
  return applyPostMapping(rows, nets, social, saved);
}


export async function searchPosts(q: string, viewerId: string): Promise<Post[]> {
  const term = `%${q.toLowerCase()}%`;
  const rows = q
    ? await sql`SELECT n.* FROM needs n JOIN companies c ON c.id = n.company_id
        WHERE lower(n.body) LIKE ${term} OR lower(n.type) LIKE ${term}
           OR lower(c.name) LIKE ${term} OR lower(c.industry) LIKE ${term}
        ORDER BY n.created_at DESC`
    : await sql`SELECT * FROM needs ORDER BY created_at DESC LIMIT 100`;
  const ids = rows.map((r) => r.id as string);
  const [nets, social, saved] = await Promise.all([
    networksForPosts(ids),
    socialCounts(ids, viewerId),
    savedSet(viewerId),
  ]);
  return applyPostMapping(rows, nets, social, saved);
}

/** @deprecated use searchPosts */
export const searchNeeds = searchPosts;

/* ----------------------------- networks ----------------------------- */
function mapNetwork(r: Row): Network {
  return {
    id: r.id as string,
    name: r.name as string,
    type: r.type as NetworkType,
    slug: r.slug as string,
    description: r.description as string,
    provinceId: (r.province_id as string) ?? undefined,
    members: (r.members as number) ?? 0,
    activeToday: (r.active_today as number) ?? 0,
  };
}

export async function getNetworks(): Promise<Network[]> {
  const rows = await sql`SELECT * FROM networks WHERE active = true ORDER BY type, name`;
  return rows.map(mapNetwork);
}

export async function getNetworkById(id: string): Promise<Network | null> {
  const rows = await sql`SELECT * FROM networks WHERE id = ${id} LIMIT 1`;
  return rows.length ? mapNetwork(rows[0]) : null;
}

export async function getNetworksByCompany(companyId: string): Promise<Network[]> {
  const rows = await sql`
    SELECT n.* FROM networks n
    JOIN network_members nm ON nm.network_id = n.id
    WHERE nm.company_id = ${companyId}
    ORDER BY n.type, n.name
  `;
  return rows.map(mapNetwork);
}

export async function getCompanyNetworks(companyId: string): Promise<string[]> {
  const rows = await sql`SELECT network_id FROM network_members WHERE company_id = ${companyId}`;
  return rows.map((r) => r.network_id as string);
}

export async function getFollowedNetworkIds(companyId: string): Promise<string[]> {
  const rows = await sql`SELECT network_id FROM network_follows WHERE company_id = ${companyId}`;
  return rows.map((r) => r.network_id as string);
}

export async function getFollowedNetworks(companyId: string): Promise<Network[]> {
  const rows = await sql`
    SELECT n.* FROM networks n
    JOIN network_follows nf ON nf.network_id = n.id
    WHERE nf.company_id = ${companyId}
    ORDER BY n.type, n.name
  `;
  return rows.map(mapNetwork);
}

export async function isNetworkFollowed(companyId: string, networkId: string): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM network_follows WHERE company_id = ${companyId} AND network_id = ${networkId} LIMIT 1`;
  return rows.length > 0;
}

export async function getRecommendedNetworks(municipalityId: string | undefined, industry: string): Promise<Network[]> {
  if (!municipalityId) return [];
  const rows = await sql`
    SELECT * FROM networks
    WHERE id IN (
      ${municipalityId},
      (SELECT province_id FROM networks WHERE id = ${municipalityId}),
      (SELECT id FROM networks WHERE slug = ${"ind-" + industry.toLowerCase().replace(/[^a-z0-9]+/g, "-")}),
      'nat-nl'
    )
  `;
  return rows.map(mapNetwork);
}

/* ----------------------------- conversations ----------------------------- */
export async function getConversations(companyId: string): Promise<Conversation[]> {
  const convRows = await sql`
    SELECT c.id, c.need_id, cp.last_read_at
    FROM conversations c
    JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.company_id = ${companyId}
    WHERE c.id NOT IN (
      SELECT conversation_id FROM archived_chats WHERE company_id = ${companyId}
    )
    ORDER BY c.created_at DESC`;

  const result: Conversation[] = [];
  for (const c of convRows) {
    const convId = c.id as string;
    const other = await sql`
      SELECT company_id FROM conversation_participants
      WHERE conversation_id = ${convId} AND company_id <> ${companyId} LIMIT 1`;
    if (other.length === 0) continue;
    const otherId = other[0].company_id as string;

    const msgRows = await sql`
      SELECT * FROM messages WHERE conversation_id = ${convId} ORDER BY created_at ASC`;
    const lastRead = new Date(c.last_read_at as string).getTime();

    const messages: Message[] = msgRows.map((m) => ({
      id: m.id as string,
      fromMe: (m.sender_company_id as string) === companyId,
      kind: m.kind as Message["kind"],
      body: m.body as string,
      meta: (m.meta as string) ?? undefined,
      time: new Date(m.created_at as string).toISOString(),
      status: (m.status as Message["status"]) || "sent",
      readAt: m.read_at ? new Date(m.read_at as string).toISOString() : undefined,
      editedAt: m.edited_at ? new Date(m.edited_at as string).toISOString() : undefined,
      deleted: (m.deleted as boolean) ?? false,
      replyToId: (m.reply_to_id as string) ?? undefined,
    }));

    const unread = msgRows.filter(
      (m) => (m.sender_company_id as string) !== companyId &&
        new Date(m.created_at as string).getTime() > lastRead
    ).length;

    result.push({
      id: convId,
      companyId: otherId,
      needId: (c.need_id as string) ?? undefined,
      unread,
      messages,
    });
  }
  // newest activity first
  result.sort((a, b) => {
    const at = a.messages.at(-1)?.time ?? "";
    const bt = b.messages.at(-1)?.time ?? "";
    return bt.localeCompare(at);
  });
  return result;
}

export async function getUnreadMessageCount(companyId: string): Promise<number> {
  const convs = await getConversations(companyId);
  return convs.reduce((a, c) => a + c.unread, 0);
}

/* ----------------------------- notifications ----------------------------- */
export async function getNotifications(companyId: string): Promise<AppNotification[]> {
  const [regularRows, oppRows] = await Promise.all([
    sql`SELECT * FROM notifications WHERE company_id = ${companyId} ORDER BY created_at DESC LIMIT 50`,
    sql`
      SELECT on2.id, on2.opportunity_id, on2.company_id, on2.status, on2.opened_at,
             on2.sent_at, o.title AS opp_title, c.name AS actor_name, c.logo_color AS actor_color
      FROM opportunity_notifications on2
      JOIN opportunities o ON o.id = on2.opportunity_id
      LEFT JOIN companies c ON c.id = o.company_id
      WHERE on2.company_id = ${companyId}
      ORDER BY on2.sent_at DESC LIMIT 20
    `,
  ]);

  const regular = regularRows.map((r) => ({
    id: r.id as string,
    type: (r.type === "community" ? "network" : r.type) as NotificationType,
    companyId: (r.actor_company_id as string) ?? undefined,
    title: r.title as string,
    body: r.body as string,
    time: new Date(r.created_at as string).toISOString(),
    read: r.read as boolean,
    needId: (r.need_id as string) ?? undefined,
  }));

  const oppNotifications: AppNotification[] = oppRows.map((r) => ({
    id: `opp-${r.id}` as string,
    type: "match" as NotificationType,
    companyId: (r.company_id as string) ?? undefined,
    title: `Nieuwe kans: ${r.opp_title}`,
    body: `${r.actor_name ?? "Een bedrijf"} heeft een aanvraag geplaatst die bij jou past.`,
    time: new Date((r.sent_at ?? r.created_at) as string).toISOString(),
    read: r.opened_at != null,
    needId: (r.opportunity_id as string) ?? undefined,
  }));

  const all = [...regular, ...oppNotifications];
  all.sort((a, b) => b.time.localeCompare(a.time));
  return all.slice(0, 70);
}

export async function getUnreadNotificationCount(companyId: string): Promise<number> {
  const [regRows, oppRows] = await Promise.all([
    sql`SELECT count(*)::int AS n FROM notifications WHERE company_id = ${companyId} AND read = false`,
    sql`SELECT count(*)::int AS n FROM opportunity_notifications WHERE company_id = ${companyId} AND opened_at IS NULL`,
  ]);
  return (regRows[0].n as number) + (oppRows[0].n as number);
}

export async function getCompaniesMap(): Promise<Record<string, Company>> {
  const rows = await sql`SELECT * FROM companies`;
  const map: Record<string, Company> = {};
  for (const r of rows) map[r.id as string] = mapCompany(r);
  return map;
}

export async function getCompanies(): Promise<Company[]> {
  const rows = await sql`SELECT * FROM companies`;
  return rows.map((r) => mapCompany(r));
}
