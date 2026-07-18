import "server-only";
import { sql } from "./db";
import type { Opportunity, CompanyOpportunityPreferences } from "./types";

type Row = Record<string, unknown>;

export interface ScoreBreakdown {
  total: number;
  category: number;
  location: number;
  availability: number;
  budget: number;
  timing: number;
  preference: number;
  quality: number;
  history: number;
  reasons: string[];
}

export interface MatchCandidate {
  companyId: string;
  companyName: string;
  serviceId: string | null;
  serviceCategoryId: string | null;
  serviceKeywords: string[];
  areaMunicipality: string | null;
  areaProvince: string | null;
  areaRadiusKm: number | null;
  areaCountry: string;
  preferences: CompanyOpportunityPreferences;
  companyRating: number;
  companyResponseRate: number;
  companyVerified: boolean;
}

const MAX_SCORE = 100;
const WEIGHTS = {
  category: 30,
  location: 20,
  availability: 15,
  budget: 10,
  timing: 10,
  preference: 8,
  quality: 4,
  history: 3,
};

/* ────────────────── Fetch candidates ────────────────── */

export async function fetchMatchCandidates(opportunity: Opportunity): Promise<MatchCandidate[]> {
  const rows = await sql`
    SELECT
      c.id AS company_id,
      c.name AS company_name,
      c.rating,
      c.response_rate,
      c.verified,
      cs.id AS service_id,
      cs.category_id AS service_category_id,
      cs.keywords AS service_keywords,
      csa.municipality AS area_municipality,
      csa.province AS area_province,
      csa.radius_km AS area_radius_km,
      csa.country AS area_country,
      cop.min_budget,
      cop.max_distance_km,
      cop.accepts_urgent,
      cop.accepts_business,
      cop.accepts_consumer,
      cop.accepts_recurring,
      cop.availability_status,
      cop.available_from,
      cop.active AS prefs_active
    FROM companies c
    LEFT JOIN company_services cs ON cs.company_id = c.id AND cs.active = true
    LEFT JOIN company_service_areas csa ON csa.company_id = c.id
    LEFT JOIN company_opportunity_preferences cop ON cop.company_id = c.id
    WHERE c.id != ${opportunity.companyId}
      AND (cop.active IS NULL OR cop.active = true)
    ORDER BY c.id
  `;

  const byCompany = new Map<string, MatchCandidate>();

  for (const r of rows) {
    const companyId = r.company_id as string;
    if (!byCompany.has(companyId)) {
      const prefs: CompanyOpportunityPreferences = {
        minBudget: r.min_budget ? Number(r.min_budget) : undefined,
        maxDistanceKm: (r.max_distance_km as number) ?? 50,
        acceptsUrgent: (r.accepts_urgent as boolean) ?? true,
        acceptsBusiness: (r.accepts_business as boolean) ?? true,
        acceptsConsumer: (r.accepts_consumer as boolean) ?? false,
        acceptsRecurring: (r.accepts_recurring as boolean) ?? true,
        availabilityStatus: (r.availability_status as string) as CompanyOpportunityPreferences["availabilityStatus"] ?? "available",
        availableFrom: r.available_from ? new Date(r.available_from as string).toISOString() : undefined,
        maxNotificationsPerDay: 10,
        notificationFrequency: "instant" as CompanyOpportunityPreferences["notificationFrequency"],
        quietHoursStart: "20:00",
        quietHoursEnd: "07:00",
        active: (r.prefs_active as boolean) ?? true,
      };

      byCompany.set(companyId, {
        companyId,
        companyName: r.company_name as string,
        serviceId: (r.service_id as string) ?? null,
        serviceCategoryId: (r.service_category_id as string) ?? null,
        serviceKeywords: (r.service_keywords as string[]) ?? [],
        areaMunicipality: (r.area_municipality as string) ?? null,
        areaProvince: (r.area_province as string) ?? null,
        areaRadiusKm: (r.area_radius_km as number) ?? null,
        areaCountry: (r.area_country as string) ?? "Nederland",
        preferences: prefs,
        companyRating: Number(r.rating) ?? 0,
        companyResponseRate: (r.response_rate as number) ?? 100,
        companyVerified: (r.verified as boolean) ?? false,
      });
    }
  }

  return Array.from(byCompany.values());
}

/* ────────────────── Score calculation ────────────────── */

export function scoreCandidate(opportunity: Opportunity, candidate: MatchCandidate): ScoreBreakdown {
  const reasons: string[] = [];

  // Category score (0-30)
  let categoryScore = 0;
  if (opportunity.categoryId && candidate.serviceCategoryId) {
    if (candidate.serviceCategoryId === opportunity.categoryId) {
      categoryScore = WEIGHTS.category;
      reasons.push("Exacte categoriematch");
    } else {
      // Check if parent category matches (simplified — same prefix)
      const oppPrefix = opportunity.categoryId.split("-").slice(0, 2).join("-");
      const candPrefix = candidate.serviceCategoryId.split("-").slice(0, 2).join("-");
      if (oppPrefix === candPrefix) {
        categoryScore = Math.round(WEIGHTS.category * 0.6);
        reasons.push("Gerelateerde categorie");
      }
    }
  }
  // Keyword overlap bonus
  if (candidate.serviceKeywords.length > 0 && opportunity.description) {
    const descLower = opportunity.description.toLowerCase();
    const matches = candidate.serviceKeywords.filter((k) => descLower.includes(k.toLowerCase()));
    if (matches.length > 0) {
      const keywordBonus = Math.min(10, matches.length * 3);
      categoryScore = Math.min(WEIGHTS.category, categoryScore + keywordBonus);
      if (matches.length >= 3) reasons.push(`Sterke trefwoordoverlap (${matches.length} trefwoorden)`);
      else if (matches.length >= 1) reasons.push("Trefwoordoverlap met jouw diensten");
    }
  }

  // Location score (0-20)
  let locationScore = 0;
  if (opportunity.locationType === "remote") {
    locationScore = WEIGHTS.location;
    reasons.push("Werk op afstand mogelijk");
  } else if (opportunity.municipality) {
    if (candidate.areaMunicipality && candidate.areaMunicipality.toLowerCase() === opportunity.municipality.toLowerCase()) {
      locationScore = WEIGHTS.location;
      reasons.push("Zelfde gemeente");
    } else if (candidate.areaProvince) {
      // Simplified: if same province (we don't have province on opportunity, assume match if municipality is known)
      locationScore = Math.round(WEIGHTS.location * 0.7);
      reasons.push("Regionale match");
    } else if (candidate.areaRadiusKm) {
      // Without geocoding, give partial score for radius coverage
      locationScore = Math.round(WEIGHTS.location * 0.5);
      reasons.push(`Werkgebied tot ${candidate.areaRadiusKm} km`);
    }
  } else {
    // No location specified on opportunity — give neutral score
    locationScore = Math.round(WEIGHTS.location * 0.5);
  }

  // Availability score (0-15)
  let availabilityScore = 0;
  const prefs = candidate.preferences;
  if (prefs.availabilityStatus === "available") {
    availabilityScore = WEIGHTS.availability;
  } else if (prefs.availabilityStatus === "limited") {
    availabilityScore = Math.round(WEIGHTS.availability * 0.6);
    reasons.push("Beperkt beschikbaar");
  } else if (prefs.availabilityStatus === "urgent_only") {
    if (opportunity.urgency === "urgent_today" || opportunity.urgency === "hours_48") {
      availabilityScore = WEIGHTS.availability;
      reasons.push("Beschikbaar voor spoed");
    } else {
      availabilityScore = 0;
    }
  } else if (prefs.availabilityStatus === "available_from" && prefs.availableFrom) {
    const availableDate = new Date(prefs.availableFrom);
    const now = new Date();
    if (availableDate <= now) {
      availabilityScore = WEIGHTS.availability;
    } else if (opportunity.startDate) {
      const startDate = new Date(opportunity.startDate);
      if (startDate >= availableDate) {
        availabilityScore = WEIGHTS.availability;
        reasons.push("Beschikbaar op startdatum");
      } else {
        availabilityScore = 0;
      }
    } else {
      availabilityScore = Math.round(WEIGHTS.availability * 0.3);
    }
  } else if (prefs.availabilityStatus === "unavailable") {
    availabilityScore = 0;
  }

  // Budget score (0-10)
  let budgetScore = 0;
  if (opportunity.budgetType === "open" || opportunity.budgetType === "discuss") {
    budgetScore = WEIGHTS.budget;
  } else if (prefs.minBudget && opportunity.budgetMax) {
    if (opportunity.budgetMax >= prefs.minBudget) {
      budgetScore = WEIGHTS.budget;
      reasons.push("Budget past binnen verwachting");
    } else {
      budgetScore = Math.round(WEIGHTS.budget * 0.3);
    }
  } else if (opportunity.budgetMin && opportunity.budgetMax) {
    budgetScore = WEIGHTS.budget;
  } else {
    budgetScore = Math.round(WEIGHTS.budget * 0.5);
  }

  // Timing score (0-10)
  let timingScore = 0;
  if (opportunity.urgency === "urgent_today" || opportunity.urgency === "hours_48") {
    if (prefs.acceptsUrgent) {
      timingScore = WEIGHTS.timing;
      reasons.push("Accepteert spoedopdrachten");
    } else {
      timingScore = 0;
    }
  } else if (opportunity.urgency === "week") {
    timingScore = Math.round(WEIGHTS.timing * 0.7);
  } else {
    timingScore = WEIGHTS.timing;
  }

  // Preference score (0-8)
  let preferenceScore = 0;
  if (opportunity.accountType === "business" && prefs.acceptsBusiness) {
    preferenceScore += WEIGHTS.preference / 2;
  }
  if (opportunity.accountType === "consumer" && prefs.acceptsConsumer) {
    preferenceScore += WEIGHTS.preference / 2;
  }
  if (opportunity.recurrenceType === "recurring" && prefs.acceptsRecurring) {
    preferenceScore += WEIGHTS.preference / 2;
    reasons.push("Accepteert terugkerende opdrachten");
  }
  preferenceScore = Math.min(WEIGHTS.preference, Math.round(preferenceScore));

  // Quality score (0-4)
  let qualityScore = 0;
  if (candidate.companyVerified) {
    qualityScore += 2;
  }
  if (candidate.companyRating >= 4.5) {
    qualityScore += 2;
    reasons.push("Hoog gewaardeerd bedrijf");
  } else if (candidate.companyRating >= 4.0) {
    qualityScore += 1;
  }
  qualityScore = Math.min(WEIGHTS.quality, qualityScore);

  // History score (0-3) — placeholder for future interaction history
  let historyScore = 0;
  // Check if they've interacted before (responses, conversations)
  // For now, give a small bonus for verified companies with high response rate
  if (candidate.companyResponseRate >= 90) {
    historyScore = WEIGHTS.history;
    reasons.push("Snelle reageerder");
  } else if (candidate.companyResponseRate >= 75) {
    historyScore = Math.round(WEIGHTS.history * 0.5);
  }

  const total = Math.min(
    MAX_SCORE,
    categoryScore + locationScore + availabilityScore + budgetScore + timingScore + preferenceScore + qualityScore + historyScore
  );

  return {
    total,
    category: categoryScore,
    location: locationScore,
    availability: availabilityScore,
    budget: budgetScore,
    timing: timingScore,
    preference: preferenceScore,
    quality: qualityScore,
    history: historyScore,
    reasons,
  };
}

/* ────────────────── Run matching ────────────────── */

export async function runMatchingForOpportunity(
  opportunityId: string,
  roundNumber: number = 1,
  options?: { minScore?: number; maxResults?: number; radiusKm?: number }
): Promise<{ matched: number; roundId: string }> {
  // Fetch opportunity
  const oppRows = await sql`SELECT * FROM opportunities WHERE id = ${opportunityId} LIMIT 1`;
  if (oppRows.length === 0) throw new Error("Opportunity not found");
  const opp = mapOpportunityRow(oppRows[0]);

  // Create distribution round
  const [roundRow] = await sql`
    INSERT INTO opportunity_distribution_rounds (opportunity_id, round_number, target_count, minimum_score, radius_km, status, started_at)
    VALUES (${opportunityId}, ${roundNumber}, ${options?.maxResults ?? 20}, ${options?.minScore ?? 30}, ${options?.radiusKm ?? null}, 'running', now())
    ON CONFLICT (opportunity_id, round_number) DO UPDATE SET status = 'running', started_at = now()
    RETURNING id
  `;
  const roundId = roundRow.id as string;

  // Fetch candidates
  const candidates = await fetchMatchCandidates(opp);

  // Score all candidates
  const scored = candidates
    .map((c) => ({ candidate: c, score: scoreCandidate(opp, c) }))
    .filter((s) => s.score.total >= (options?.minScore ?? 30))
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, options?.maxResults ?? 20);

  // Insert matches
  let matched = 0;
  for (const { candidate, score } of scored) {
    try {
      await sql`
        INSERT INTO opportunity_matches (
          opportunity_id, company_id,
          total_score, category_score, location_score, availability_score,
          budget_score, timing_score, preference_score, quality_score, history_score,
          reason_json, rule_version, round_number, status, matched_at
        )
        VALUES (
          ${opportunityId}, ${candidate.companyId},
          ${score.total}, ${score.category}, ${score.location}, ${score.availability},
          ${score.budget}, ${score.timing}, ${score.preference}, ${score.quality}, ${score.history},
          ${JSON.stringify(score.reasons)}, 'v1', ${roundNumber}, 'delivered', now()
        )
        ON CONFLICT (opportunity_id, company_id) DO UPDATE SET
          total_score = EXCLUDED.total_score,
          category_score = EXCLUDED.category_score,
          location_score = EXCLUDED.location_score,
          availability_score = EXCLUDED.availability_score,
          budget_score = EXCLUDED.budget_score,
          timing_score = EXCLUDED.timing_score,
          preference_score = EXCLUDED.preference_score,
          quality_score = EXCLUDED.quality_score,
          history_score = EXCLUDED.history_score,
          reason_json = EXCLUDED.reason_json,
          round_number = EXCLUDED.round_number,
          status = CASE WHEN opportunity_matches.status NOT IN ('opened', 'interested', 'not_relevant') THEN 'delivered' ELSE opportunity_matches.status END,
          matched_at = now()
      `;
      matched++;
    } catch {
      // Skip duplicates or errors
    }
  }

  // Create in-app notifications for matched companies
  for (const { candidate, score } of scored) {
    await sql`
      INSERT INTO opportunity_notifications (opportunity_id, company_id, channel, status, sent_at, delivered_at)
      VALUES (${opportunityId}, ${candidate.companyId}, 'in_app', 'sent', now(), now())
      ON CONFLICT DO NOTHING
    `;
  }

  // Update opportunity status
  await sql`UPDATE opportunities SET status = 'matching', updated_at = now() WHERE id = ${opportunityId} AND status = 'active'`;

  // Complete the round
  await sql`
    UPDATE opportunity_distribution_rounds SET status = 'completed', completed_at = now()
    WHERE id = ${roundId}
  `;

  return { matched, roundId };
}

/* ────────────────── Expansion round ────────────────── */

export async function runExpansionRound(opportunityId: string): Promise<{ matched: number; roundNumber: number }> {
  const rounds = await sql`SELECT round_number FROM opportunity_distribution_rounds WHERE opportunity_id = ${opportunityId} ORDER BY round_number DESC LIMIT 1`;
  const nextRound = rounds.length > 0 ? (rounds[0].round_number as number) + 1 : 2;

  const result = await runMatchingForOpportunity(opportunityId, nextRound, {
    minScore: 20, // Lower threshold for expansion
    maxResults: 40, // More results
  });

  return { matched: result.matched, roundNumber: nextRound };
}

/* ────────────────── Helpers ────────────────── */

function mapOpportunityRow(r: Row): Opportunity {
  return {
    id: r.id as string,
    companyId: r.company_id as string,
    opportunityType: r.opportunity_type as Opportunity["opportunityType"],
    title: r.title as string,
    description: (r.description as string) ?? undefined,
    categoryId: (r.category_id as string) ?? undefined,
    status: r.status as Opportunity["status"],
    urgency: r.urgency as Opportunity["urgency"],
    budgetType: r.budget_type as Opportunity["budgetType"],
    budgetMin: r.budget_min ? Number(r.budget_min) : undefined,
    budgetMax: r.budget_max ? Number(r.budget_max) : undefined,
    currency: r.currency as string,
    quantity: (r.quantity as string) ?? undefined,
    unit: (r.unit as string) ?? undefined,
    locationType: r.location_type as Opportunity["locationType"],
    municipality: (r.municipality as string) ?? undefined,
    province: (r.province as string) ?? undefined,
    country: r.country as string,
    startDate: r.start_date ? new Date(r.start_date as string).toISOString() : undefined,
    endDate: r.end_date ? new Date(r.end_date as string).toISOString() : undefined,
    responseDeadline: r.response_deadline ? new Date(r.response_deadline as string).toISOString() : undefined,
    recurrenceType: r.recurrence_type as Opportunity["recurrenceType"],
    visibilityMode: r.visibility_mode as Opportunity["visibilityMode"],
    accountType: r.account_type as Opportunity["accountType"],
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
    publishedAt: r.published_at ? new Date(r.published_at as string).toISOString() : undefined,
    closedAt: r.closed_at ? new Date(r.closed_at as string).toISOString() : undefined,
  };
}
