import "server-only";
import { sql } from "./db";
import type {
  ServiceCategory,
  CompanyService,
  CompanyServiceArea,
  CompanyOpportunityPreferences,
  Opportunity,
  OpportunityCard,
  OpportunityMatch,
  OpportunityResponse,
  DistributionRound,
  OpportunityDraft,
  OpportunityType,
  OpportunityStatus,
  UrgencyLevel,
  BudgetType,
  LocationType,
  RecurrenceType,
  VisibilityMode,
  AccountType,
  AvailabilityStatus,
  NotificationFrequency,
  MatchStatus,
  ResponseStatus,
} from "./types";

type Row = Record<string, unknown>;

/* ────────────────── Service Categories ────────────────── */

function mapCategory(r: Row): ServiceCategory {
  return {
    id: r.id as string,
    parentId: (r.parent_id as string) ?? null,
    name: r.name as string,
    slug: r.slug as string,
    level: r.level as number,
    sortOrder: r.sort_order as number,
    active: r.active as boolean,
  };
}

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const rows = await sql`SELECT * FROM service_categories WHERE active = true ORDER BY level, sort_order, name`;
  return rows.map(mapCategory);
}

export async function getCategoryById(id: string): Promise<ServiceCategory | null> {
  const rows = await sql`SELECT * FROM service_categories WHERE id = ${id} LIMIT 1`;
  return rows.length ? mapCategory(rows[0]) : null;
}

export async function getCategoryPath(categoryId: string): Promise<string> {
  const rows = await sql`
    WITH RECURSIVE path AS (
      SELECT id, parent_id, name, 0 AS depth FROM service_categories WHERE id = ${categoryId}
      UNION ALL
      SELECT c.id, c.parent_id, c.name, p.depth + 1
      FROM service_categories c JOIN path p ON c.id = p.parent_id
    )
    SELECT name FROM path ORDER BY depth DESC
  `;
  return rows.map((r) => r.name as string).join(" → ");
}

/* ────────────────── Company Services ────────────────── */

function mapCompanyService(r: Row): CompanyService {
  return {
    id: r.id as string,
    companyId: r.company_id as string,
    categoryId: (r.category_id as string) ?? null,
    keywords: (r.keywords as string[]) ?? [],
    active: r.active as boolean,
  };
}

export async function getCompanyServices(companyId: string): Promise<CompanyService[]> {
  const rows = await sql`SELECT * FROM company_services WHERE company_id = ${companyId} ORDER BY created_at DESC`;
  return rows.map(mapCompanyService);
}

export async function getCompanyServiceAreas(companyId: string): Promise<CompanyServiceArea[]> {
  const rows = await sql`SELECT * FROM company_service_areas WHERE company_id = ${companyId} ORDER BY created_at DESC`;
  return rows.map((r) => ({
    id: r.id as string,
    companyId: r.company_id as string,
    serviceId: (r.service_id as string) ?? null,
    areaType: r.area_type as CompanyServiceArea["areaType"],
    municipality: (r.municipality as string) ?? undefined,
    province: (r.province as string) ?? undefined,
    radiusKm: (r.radius_km as number) ?? undefined,
    country: r.country as string,
  }));
}

/* ────────────────── Company Preferences ────────────────── */

function mapPreferences(r: Row): CompanyOpportunityPreferences {
  return {
    minBudget: r.min_budget ? Number(r.min_budget) : undefined,
    maxDistanceKm: r.max_distance_km as number,
    minProjectSize: (r.min_project_size as string) ?? undefined,
    maxProjectSize: (r.max_project_size as string) ?? undefined,
    acceptsUrgent: r.accepts_urgent as boolean,
    acceptsBusiness: r.accepts_business as boolean,
    acceptsConsumer: r.accepts_consumer as boolean,
    acceptsRecurring: r.accepts_recurring as boolean,
    availabilityStatus: r.availability_status as AvailabilityStatus,
    availableFrom: r.available_from ? new Date(r.available_from as string).toISOString() : undefined,
    maxNotificationsPerDay: r.max_notifications_per_day as number,
    notificationFrequency: r.notification_frequency as NotificationFrequency,
    quietHoursStart: (r.quiet_hours_start as string) ?? "20:00",
    quietHoursEnd: (r.quiet_hours_end as string) ?? "07:00",
    active: r.active as boolean,
  };
}

export async function getCompanyPreferences(companyId: string): Promise<CompanyOpportunityPreferences> {
  const rows = await sql`SELECT * FROM company_opportunity_preferences WHERE company_id = ${companyId} LIMIT 1`;
  if (rows.length === 0) {
    await sql`INSERT INTO company_opportunity_preferences (company_id) VALUES (${companyId}) ON CONFLICT DO NOTHING`;
    const retry = await sql`SELECT * FROM company_opportunity_preferences WHERE company_id = ${companyId} LIMIT 1`;
    return mapPreferences(retry[0]);
  }
  return mapPreferences(rows[0]);
}

/* ────────────────── Opportunities ────────────────── */

function mapOpportunity(r: Row): Opportunity {
  return {
    id: r.id as string,
    companyId: r.company_id as string,
    opportunityType: r.opportunity_type as OpportunityType,
    title: r.title as string,
    description: (r.description as string) ?? undefined,
    categoryId: (r.category_id as string) ?? undefined,
    status: r.status as OpportunityStatus,
    urgency: r.urgency as UrgencyLevel,
    budgetType: r.budget_type as BudgetType,
    budgetMin: r.budget_min ? Number(r.budget_min) : undefined,
    budgetMax: r.budget_max ? Number(r.budget_max) : undefined,
    currency: r.currency as string,
    quantity: (r.quantity as string) ?? undefined,
    unit: (r.unit as string) ?? undefined,
    locationType: r.location_type as LocationType,
    municipality: (r.municipality as string) ?? undefined,
    province: (r.province as string) ?? undefined,
    country: r.country as string,
    startDate: r.start_date ? new Date(r.start_date as string).toISOString() : undefined,
    endDate: r.end_date ? new Date(r.end_date as string).toISOString() : undefined,
    responseDeadline: r.response_deadline ? new Date(r.response_deadline as string).toISOString() : undefined,
    recurrenceType: r.recurrence_type as RecurrenceType,
    visibilityMode: r.visibility_mode as VisibilityMode,
    accountType: r.account_type as AccountType,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
    publishedAt: r.published_at ? new Date(r.published_at as string).toISOString() : undefined,
    closedAt: r.closed_at ? new Date(r.closed_at as string).toISOString() : undefined,
  };
}

export async function getOpportunityById(id: string): Promise<Opportunity | null> {
  const rows = await sql`SELECT * FROM opportunities WHERE id = ${id} LIMIT 1`;
  return rows.length ? mapOpportunity(rows[0]) : null;
}

export async function getOpportunityAccess(opportunityId: string, companyId: string): Promise<{
  exists: boolean;
  isOwner: boolean;
  canView: boolean;
  saved: boolean;
  deadlineExpired: boolean;
  matchId?: string;
}> {
  const rows = await sql`
    SELECT o.company_id, o.status, o.visibility_mode,
           match.id AS match_id,
           (saved.id IS NOT NULL) AS saved,
           (o.response_deadline IS NOT NULL AND o.response_deadline < now()) AS deadline_expired
    FROM opportunities o
    LEFT JOIN opportunity_matches match ON match.opportunity_id = o.id AND match.company_id = ${companyId}
    LEFT JOIN opportunity_feedback saved ON saved.opportunity_id = o.id AND saved.company_id = ${companyId} AND saved.feedback_type = 'saved'
    WHERE o.id = ${opportunityId}
    LIMIT 1
  `;
  if (!rows.length) return { exists: false, isOwner: false, canView: false, saved: false, deadlineExpired: false };
  const row = rows[0];
  const isOwner = row.company_id === companyId;
  const isPrivateDraft = row.status === "draft" || row.status === "paused";
  const canView = isOwner || (!isPrivateDraft && (row.visibility_mode === "public" || row.visibility_mode === "after_interest" || Boolean(row.match_id)));
  return {
    exists: true,
    isOwner,
    canView,
    saved: Boolean(row.saved),
    deadlineExpired: Boolean(row.deadline_expired),
    matchId: (row.match_id as string) ?? undefined,
  };
}

export async function getOpportunitiesByCompany(companyId: string): Promise<Opportunity[]> {
  const rows = await sql`SELECT * FROM opportunities WHERE company_id = ${companyId} ORDER BY created_at DESC`;
  return rows.map(mapOpportunity);
}

export type OpportunityListTab = "for_you" | "new" | "nearby" | "sector" | "saved" | "mine";
export type OpportunityListSort = "relevant" | "newest" | "deadline" | "budget_high" | "nearby";

export interface OpportunityListFilters {
  tab?: OpportunityListTab;
  query?: string;
  type?: OpportunityType | "";
  location?: string;
  sector?: string;
  date?: "" | "today" | "week" | "month";
  status?: OpportunityStatus | "closed" | "";
  sort?: OpportunityListSort;
  page?: number;
  limit?: number;
}

export interface OpportunityListing {
  cards: OpportunityCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const LIST_TABS = new Set<OpportunityListTab>(["for_you", "new", "nearby", "sector", "saved", "mine"]);
const LIST_SORTS = new Set<OpportunityListSort>(["relevant", "newest", "deadline", "budget_high", "nearby"]);
const LIST_TYPES = new Set<OpportunityType>(["request", "job", "sourcing", "offer", "capacity", "partnership", "urgent"]);
const LIST_STATUSES = new Set<OpportunityStatus>(["draft", "active", "paused", "matching", "responses_received", "in_conversation", "party_selected", "preparing_deal", "completed", "cancelled", "expired"]);

function cleanListFilters(opts: OpportunityListFilters) {
  const tab = opts.tab && LIST_TABS.has(opts.tab) ? opts.tab : "for_you";
  const sort = opts.sort && LIST_SORTS.has(opts.sort) ? opts.sort : tab === "new" ? "newest" : "relevant";
  const requestedStatus = opts.status === "closed" || (opts.status && LIST_STATUSES.has(opts.status)) ? opts.status : "" as const;
  const status = tab !== "mine" && (requestedStatus === "draft" || requestedStatus === "paused") ? "" as const : requestedStatus;
  return {
    tab,
    query: (opts.query ?? "").trim().slice(0, 120),
    type: opts.type && LIST_TYPES.has(opts.type) ? opts.type : "" as const,
    location: (opts.location ?? "").trim().slice(0, 80),
    sector: (opts.sector ?? "").trim().slice(0, 80),
    date: opts.date === "today" || opts.date === "week" || opts.date === "month" ? opts.date : "" as const,
    status,
    sort,
    page: Math.max(1, Math.floor(opts.page ?? 1)),
    limit: Math.min(30, Math.max(6, Math.floor(opts.limit ?? 12))),
  };
}

export async function getOpportunityListing(companyId: string, opts: OpportunityListFilters = {}): Promise<OpportunityListing> {
  const filters = cleanListFilters(opts);
  const viewerRows = await sql`SELECT municipality, city, province, industry FROM companies WHERE id = ${companyId} LIMIT 1`;
  const viewer = viewerRows[0] ?? {};
  const viewerMunicipality = ((viewer.municipality as string) || (viewer.city as string) || "").trim();
  const viewerProvince = ((viewer.province as string) || "").trim();
  const viewerIndustry = ((viewer.industry as string) || "").trim();

  const values: unknown[] = [companyId];
  const where: string[] = [];
  const addValue = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (filters.tab === "mine") {
    where.push("o.company_id = $1", "o.status <> 'draft'");
  } else {
    where.push("o.company_id <> $1");
    if (filters.tab === "saved") {
      where.push("saved_feedback.id IS NOT NULL", "o.status <> 'draft'");
    } else {
      if (!filters.status) where.push("o.status IN ('active', 'matching', 'responses_received', 'in_conversation')");
      else where.push("o.status <> 'draft'", "o.status <> 'paused'");
      where.push("(o.visibility_mode IN ('public', 'after_interest') OR viewer_match.id IS NOT NULL)");
      where.push("NOT EXISTS (SELECT 1 FROM opportunity_feedback hidden_feedback WHERE hidden_feedback.opportunity_id = o.id AND hidden_feedback.company_id = $1 AND hidden_feedback.feedback_type = 'not_relevant')");
    }

    if (filters.tab === "nearby") {
      const locationConditions: string[] = [];
      if (viewerMunicipality) locationConditions.push(`LOWER(COALESCE(o.municipality, '')) = LOWER(${addValue(viewerMunicipality)})`);
      if (viewerProvince) locationConditions.push(`LOWER(COALESCE(o.province, '')) = LOWER(${addValue(viewerProvince)})`);
      locationConditions.push("o.location_type = 'remote'");
      where.push(`(${locationConditions.join(" OR ")})`);
    }

    if (filters.tab === "sector") {
      const sectorParts = ["o.category_id IN (SELECT category_id FROM company_services WHERE company_id = $1 AND active = true AND category_id IS NOT NULL)"];
      if (viewerIndustry) sectorParts.push(`COALESCE(category.name, '') ILIKE ${addValue(`%${viewerIndustry}%`)}`);
      where.push(`(${sectorParts.join(" OR ")})`);
    }
  }

  if (filters.query) {
    const p = addValue(`%${filters.query}%`);
    where.push(`(o.title ILIKE ${p} OR COALESCE(o.description, '') ILIKE ${p} OR c.name ILIKE ${p} OR COALESCE(o.municipality, '') ILIKE ${p} OR COALESCE(category.name, '') ILIKE ${p})`);
  }
  if (filters.type) where.push(`o.opportunity_type = ${addValue(filters.type)}`);
  if (filters.location) {
    if (filters.location === "remote") where.push("o.location_type = 'remote'");
    else {
      const p = addValue(`%${filters.location}%`);
      where.push(`(COALESCE(o.municipality, '') ILIKE ${p} OR COALESCE(o.province, '') ILIKE ${p} OR COALESCE(o.country, '') ILIKE ${p})`);
    }
  }
  if (filters.sector) {
    const p = addValue(filters.sector);
    where.push(`o.category_id IN (WITH RECURSIVE descendants AS (SELECT id FROM service_categories WHERE id = ${p} UNION ALL SELECT child.id FROM service_categories child JOIN descendants parent ON child.parent_id = parent.id) SELECT id FROM descendants)`);
  }
  if (filters.date === "today") where.push("COALESCE(o.published_at, o.created_at) >= CURRENT_DATE");
  if (filters.date === "week") where.push("COALESCE(o.published_at, o.created_at) >= now() - interval '7 days'");
  if (filters.date === "month") where.push("COALESCE(o.published_at, o.created_at) >= now() - interval '30 days'");
  if (filters.status === "closed") where.push("o.status IN ('completed', 'cancelled')");
  else if (filters.status) where.push(`o.status = ${addValue(filters.status)}`);

  let orderBy = "CASE WHEN viewer_match.total_score IS NOT NULL THEN 0 ELSE 1 END, viewer_match.total_score DESC NULLS LAST, COALESCE(o.published_at, o.created_at) DESC";
  if (filters.sort === "newest") orderBy = "COALESCE(o.published_at, o.created_at) DESC";
  if (filters.sort === "deadline") orderBy = "o.response_deadline ASC NULLS LAST, COALESCE(o.published_at, o.created_at) DESC";
  if (filters.sort === "budget_high") orderBy = "GREATEST(COALESCE(o.budget_max, 0), COALESCE(o.budget_min, 0)) DESC, COALESCE(o.published_at, o.created_at) DESC";
  if (filters.sort === "nearby") {
    const municipalityParam = addValue(viewerMunicipality || "__none__");
    const provinceParam = addValue(viewerProvince || "__none__");
    orderBy = `CASE WHEN LOWER(COALESCE(o.municipality, '')) = LOWER(${municipalityParam}) THEN 0 WHEN LOWER(COALESCE(o.province, '')) = LOWER(${provinceParam}) THEN 1 WHEN o.location_type = 'remote' THEN 2 ELSE 3 END, COALESCE(o.published_at, o.created_at) DESC`;
  }

  const offset = (filters.page - 1) * filters.limit;
  values.push(filters.limit, offset);
  const limitParam = `$${values.length - 1}`;
  const offsetParam = `$${values.length}`;
  const rows = await sql.unsafe(`
    SELECT o.*, c.name AS company_name, c.logo_color, c.logo_url, c.verified,
           c.industry AS company_industry, c.municipality AS company_municipality, c.province AS company_province,
           category.name AS category_name,
           viewer_match.id AS match_id, viewer_match.total_score, viewer_match.reason_json, viewer_match.status AS match_status,
           (saved_feedback.id IS NOT NULL) AS saved,
           (SELECT count(*)::int FROM opportunity_responses response WHERE response.opportunity_id = o.id AND response.withdrawn_at IS NULL AND response.status <> 'question') AS response_count,
           count(*) OVER()::int AS full_count
    FROM opportunities o
    JOIN companies c ON c.id = o.company_id
    LEFT JOIN service_categories category ON category.id = o.category_id
    LEFT JOIN opportunity_matches viewer_match ON viewer_match.opportunity_id = o.id AND viewer_match.company_id = $1
    LEFT JOIN opportunity_feedback saved_feedback ON saved_feedback.opportunity_id = o.id AND saved_feedback.company_id = $1 AND saved_feedback.feedback_type = 'saved'
    WHERE ${where.join(" AND ")}
    ORDER BY ${orderBy}
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `, values as never[]);

  if (!rows.length && filters.page > 1) {
    return getOpportunityListing(companyId, { ...opts, page: 1 });
  }
  const cards = rows.map((row) => buildCard(row, companyId));
  const total = rows.length ? Number(rows[0].full_count) : 0;
  return { cards, total, page: filters.page, pageSize: filters.limit, totalPages: Math.max(1, Math.ceil(total / filters.limit)) };
}

export async function getOpportunityCards(
  companyId: string,
  opts: { tab?: string; limit?: number } = {}
): Promise<OpportunityCard[]> {
  const tab: OpportunityListTab = opts.tab === "mine" || opts.tab === "saved" || opts.tab === "new" ? opts.tab : "for_you";
  return (await getOpportunityListing(companyId, { tab, limit: opts.limit ?? 30 })).cards;
}

export async function getOpportunityCardsLegacy(
  companyId: string,
  opts: {
    tab?: string;
    limit?: number;
  } = {}
): Promise<OpportunityCard[]> {
  const limit = opts.limit ?? 50;
  const tab = opts.tab ?? "for_you";

  if (tab === "mine") {
    const rows = await sql`
      SELECT o.*, c.name AS company_name, c.logo_color, c.logo_url, c.verified,
             (SELECT count(*)::int FROM opportunity_responses WHERE opportunity_id = o.id) AS response_count
      FROM opportunities o
      JOIN companies c ON c.id = o.company_id
      WHERE o.company_id = ${companyId} AND o.status NOT IN ('draft')
      ORDER BY o.created_at DESC
      LIMIT ${limit}
    `;
    return rows.map((r) => buildCard(r, companyId));
  }

  if (tab === "viewed" || tab === "responded" || tab === "saved" || tab === "not_relevant") {
    const statusMap: Record<string, string> = {
      viewed: "opened",
      responded: "interested",
      not_relevant: "not_relevant",
    };
    const matchStatus = statusMap[tab] ?? "opened";
    const rows = await sql`
      SELECT o.*, c.name AS company_name, c.logo_color, c.logo_url, c.verified,
             m.total_score, m.reason_json, m.status AS match_status,
             (SELECT count(*)::int FROM opportunity_responses WHERE opportunity_id = o.id) AS response_count
      FROM opportunities o
      JOIN companies c ON c.id = o.company_id
      JOIN opportunity_matches m ON m.opportunity_id = o.id AND m.company_id = ${companyId}
      WHERE m.status = ${matchStatus} AND o.status NOT IN ('draft', 'cancelled', 'expired')
      ORDER BY o.created_at DESC
      LIMIT ${limit}
    `;
    return rows.map((r) => buildCard(r, companyId));
  }

  // Default: for_you — show matched opportunities
  const rows = await sql`
    SELECT o.*, c.name AS company_name, c.logo_color, c.logo_url, c.verified,
           m.total_score, m.reason_json, m.status AS match_status,
           (SELECT count(*)::int FROM opportunity_responses WHERE opportunity_id = o.id) AS response_count
    FROM opportunities o
    JOIN companies c ON c.id = o.company_id
    LEFT JOIN opportunity_matches m ON m.opportunity_id = o.id AND m.company_id = ${companyId}
    WHERE o.status IN ('active', 'matching', 'responses_received')
      AND o.company_id != ${companyId}
      AND (m.status IS NULL OR m.status NOT IN ('not_relevant', 'dismissed'))
    ORDER BY
      CASE WHEN m.total_score IS NOT NULL THEN 0 ELSE 1 END,
      m.total_score DESC NULLS LAST,
      o.created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => buildCard(r, companyId));
}

function buildCard(r: Row, _viewerId: string): OpportunityCard {
  void _viewerId;
  const base = mapOpportunity(r);
  const reasons = r.reason_json as string[] | null;
  return {
    ...base,
    companyName: r.company_name as string,
    companyLogoColor: r.logo_color as string,
    companyLogoUrl: (r.logo_url as string) ?? undefined,
    companyVerified: r.verified as boolean,
    companyIndustry: (r.company_industry as string) ?? undefined,
    companyMunicipality: (r.company_municipality as string) ?? undefined,
    companyProvince: (r.company_province as string) ?? undefined,
    categoryPath: (r.category_name as string) ?? "",
    responseCount: r.response_count as number,
    saved: Boolean(r.saved),
    matchId: (r.match_id as string) ?? undefined,
    matchScore: r.total_score != null ? (r.total_score as number) : undefined,
    matchReasons: reasons ?? undefined,
    matchStatus: (r.match_status as MatchStatus) ?? undefined,
  };
}

/* ────────────────── Opportunity Matches ────────────────── */

function mapMatch(r: Row): OpportunityMatch {
  return {
    id: r.id as string,
    opportunityId: r.opportunity_id as string,
    companyId: r.company_id as string,
    totalScore: r.total_score as number,
    categoryScore: r.category_score as number,
    locationScore: r.location_score as number,
    availabilityScore: r.availability_score as number,
    budgetScore: r.budget_score as number,
    timingScore: r.timing_score as number,
    preferenceScore: r.preference_score as number,
    qualityScore: r.quality_score as number,
    historyScore: r.history_score as number,
    reasons: (r.reason_json as string[]) ?? [],
    ruleVersion: r.rule_version as string,
    roundNumber: r.round_number as number,
    status: r.status as MatchStatus,
    matchedAt: new Date(r.matched_at as string).toISOString(),
    deliveredAt: r.delivered_at ? new Date(r.delivered_at as string).toISOString() : undefined,
    openedAt: r.opened_at ? new Date(r.opened_at as string).toISOString() : undefined,
    dismissedAt: r.dismissed_at ? new Date(r.dismissed_at as string).toISOString() : undefined,
  };
}

export async function getMatchesForOpportunity(opportunityId: string): Promise<OpportunityMatch[]> {
  const rows = await sql`SELECT * FROM opportunity_matches WHERE opportunity_id = ${opportunityId} ORDER BY total_score DESC`;
  return rows.map(mapMatch);
}

export async function getMatchesForCompany(companyId: string): Promise<OpportunityMatch[]> {
  const rows = await sql`SELECT * FROM opportunity_matches WHERE company_id = ${companyId} ORDER BY matched_at DESC`;
  return rows.map(mapMatch);
}

export async function getNewMatchCount(companyId: string): Promise<number> {
  const rows = await sql`
    SELECT count(*)::int AS n FROM opportunity_matches
    WHERE company_id = ${companyId} AND status = 'delivered'
  `;
  return rows[0].n as number;
}

/* ────────────────── Opportunity Responses ────────────────── */

function mapResponse(r: Row): OpportunityResponse {
  return {
    id: r.id as string,
    opportunityId: r.opportunity_id as string,
    respondingCompanyId: r.responding_company_id as string,
    status: r.status as ResponseStatus,
    message: (r.message as string) ?? "",
    priceType: (r.price_type as BudgetType) ?? undefined,
    priceMin: r.price_min ? Number(r.price_min) : undefined,
    priceMax: r.price_max ? Number(r.price_max) : undefined,
    availableFrom: r.available_from ? new Date(r.available_from as string).toISOString() : undefined,
    createdAt: new Date(r.created_at as string).toISOString(),
    withdrawnAt: r.withdrawn_at ? new Date(r.withdrawn_at as string).toISOString() : undefined,
  };
}

export async function getResponsesForOpportunity(
  opportunityId: string,
  viewerCompanyId: string,
  isOwner: boolean
): Promise<OpportunityResponse[]> {
  const rows = isOwner
    ? await sql`SELECT * FROM opportunity_responses WHERE opportunity_id = ${opportunityId} AND withdrawn_at IS NULL ORDER BY created_at ASC`
    : await sql`SELECT * FROM opportunity_responses WHERE opportunity_id = ${opportunityId} AND responding_company_id = ${viewerCompanyId} AND withdrawn_at IS NULL ORDER BY created_at ASC`;
  return rows.map(mapResponse);
}

/* ────────────────── Distribution Rounds ────────────────── */

export async function getDistributionRounds(opportunityId: string): Promise<DistributionRound[]> {
  const rows = await sql`SELECT * FROM opportunity_distribution_rounds WHERE opportunity_id = ${opportunityId} ORDER BY round_number ASC`;
  return rows.map((r) => ({
    id: r.id as string,
    opportunityId: r.opportunity_id as string,
    roundNumber: r.round_number as number,
    startedAt: new Date(r.started_at as string).toISOString(),
    completedAt: r.completed_at ? new Date(r.completed_at as string).toISOString() : undefined,
    targetCount: r.target_count as number,
    minimumScore: r.minimum_score as number,
    radiusKm: (r.radius_km as number) ?? undefined,
    status: r.status as DistributionRound["status"],
    triggerReason: (r.trigger_reason as string) ?? undefined,
  }));
}

/* ────────────────── Drafts ────────────────── */

export async function getOpportunityDrafts(companyId: string): Promise<OpportunityDraft[]> {
  const rows = await sql`SELECT * FROM opportunity_drafts WHERE company_id = ${companyId} ORDER BY updated_at DESC`;
  return rows.map((r) => ({
    id: r.id as string,
    companyId: r.company_id as string,
    data: r.data as Record<string, unknown>,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  }));
}

export async function getOpportunityDraftById(id: string, companyId: string): Promise<OpportunityDraft | null> {
  const rows = await sql`SELECT * FROM opportunity_drafts WHERE id = ${id} AND company_id = ${companyId} LIMIT 1`;
  if (!rows.length) return null;
  return {
    id: rows[0].id as string,
    companyId: rows[0].company_id as string,
    data: rows[0].data as Record<string, unknown>,
    createdAt: new Date(rows[0].created_at as string).toISOString(),
    updatedAt: new Date(rows[0].updated_at as string).toISOString(),
  };
}
