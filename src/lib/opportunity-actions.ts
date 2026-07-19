"use server";

import { revalidatePath } from "next/cache";
import { sql } from "./db";
import { requireCompanyId } from "./auth";
import { runMatchingForOpportunity, runExpansionRound } from "./opportunity-matching";
import type {
  AvailabilityStatus,
  NotificationFrequency,
  CompanyServiceArea,
  OpportunityType,
  UrgencyLevel,
  BudgetType,
  LocationType,
  RecurrenceType,
  VisibilityMode,
  ResponseStatus,
} from "./types";

type Result = { ok: boolean; error?: string };

export interface OpportunityInput {
  title: string;
  description?: string;
  categoryId?: string;
  opportunityType?: string;
  urgency?: string;
  budgetType?: string;
  budgetMin?: number;
  budgetMax?: number;
  quantity?: string;
  unit?: string;
  locationType?: string;
  municipality?: string;
  province?: string;
  startDate?: string;
  endDate?: string;
  responseDeadline?: string;
  recurrenceType?: string;
  visibilityMode?: string;
}

type CleanOpportunityInput = Omit<OpportunityInput, "opportunityType" | "urgency" | "budgetType" | "locationType" | "recurrenceType" | "visibilityMode"> & {
  opportunityType: OpportunityType;
  urgency: UrgencyLevel;
  budgetType: BudgetType;
  locationType: LocationType;
  recurrenceType: RecurrenceType;
  visibilityMode: VisibilityMode;
};

const OPPORTUNITY_TYPES = new Set<OpportunityType>(["request", "job", "sourcing", "offer", "capacity", "partnership", "urgent"]);
const URGENCY_LEVELS = new Set<UrgencyLevel>(["normal", "week", "hours_48", "urgent_today"]);
const BUDGET_TYPES = new Set<BudgetType>(["fixed", "range", "per_hour", "per_unit", "per_project", "open", "discuss"]);
const LOCATION_TYPES = new Set<LocationType>(["on_site", "remote", "delivery"]);
const RECURRENCE_TYPES = new Set<RecurrenceType>(["one_time", "recurring"]);
const VISIBILITY_MODES = new Set<VisibilityMode>(["public", "matched_only", "after_interest"]);

function cleanText(value: string | undefined, maxLength: number) {
  const cleaned = value?.trim().replace(/\s+/g, " ") ?? "";
  return cleaned.slice(0, maxLength) || undefined;
}

function cleanLongText(value: string | undefined, maxLength: number) {
  const cleaned = value?.trim() ?? "";
  return cleaned.slice(0, maxLength) || undefined;
}

function validDate(value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : value;
}

function validateOpportunityInput(input: OpportunityInput): Result & { value?: CleanOpportunityInput } {
  const title = cleanText(input.title, 120);
  if (!title || title.length < 8) return { ok: false, error: "Maak de titel iets concreter (minimaal 8 tekens)." };
  const description = cleanLongText(input.description, 5000);
  if (!description || description.length < 30) return { ok: false, error: "Beschrijf de kans in minimaal 30 tekens." };
  const categoryId = cleanText(input.categoryId, 80);
  if (!categoryId) return { ok: false, error: "Kies een sector voor deze kans." };
  const locationType = LOCATION_TYPES.has(input.locationType as LocationType) ? input.locationType as LocationType : "on_site";
  const municipality = cleanText(input.municipality, 80);
  const province = cleanText(input.province, 80);
  if (locationType !== "remote" && !municipality && !province) return { ok: false, error: "Vul een plaats of provincie in." };

  const budgetMin = Number.isFinite(input.budgetMin) && Number(input.budgetMin) >= 0 ? Number(input.budgetMin) : undefined;
  const budgetMax = Number.isFinite(input.budgetMax) && Number(input.budgetMax) >= 0 ? Number(input.budgetMax) : undefined;
  if (budgetMin != null && budgetMax != null && budgetMax < budgetMin) {
    return { ok: false, error: "Het maximumbudget moet hoger zijn dan het minimumbudget." };
  }

  const responseDeadline = validDate(input.responseDeadline);
  if (input.responseDeadline && !responseDeadline) return { ok: false, error: "Kies een geldige reactiedeadline." };
  const startDate = validDate(input.startDate);
  const endDate = validDate(input.endDate);
  if (input.startDate && !startDate) return { ok: false, error: "Kies een geldige startdatum." };
  if (input.endDate && !endDate) return { ok: false, error: "Kies een geldige einddatum." };
  if (startDate && endDate && new Date(endDate).getTime() < new Date(startDate).getTime()) {
    return { ok: false, error: "De einddatum kan niet vóór de startdatum liggen." };
  }

  return {
    ok: true,
    value: {
      title,
      description,
      categoryId,
      opportunityType: OPPORTUNITY_TYPES.has(input.opportunityType as OpportunityType) ? input.opportunityType as OpportunityType : "request",
      urgency: URGENCY_LEVELS.has(input.urgency as UrgencyLevel) ? input.urgency as UrgencyLevel : "normal",
      budgetType: BUDGET_TYPES.has(input.budgetType as BudgetType) ? input.budgetType as BudgetType : "open",
      budgetMin,
      budgetMax,
      quantity: cleanText(input.quantity, 60),
      unit: cleanText(input.unit, 40),
      locationType,
      municipality,
      province,
      startDate,
      endDate,
      responseDeadline,
      recurrenceType: RECURRENCE_TYPES.has(input.recurrenceType as RecurrenceType) ? input.recurrenceType as RecurrenceType : "one_time",
      visibilityMode: VISIBILITY_MODES.has(input.visibilityMode as VisibilityMode) ? input.visibilityMode as VisibilityMode : "public",
    },
  };
}

/* ────────────────── Company Services ────────────────── */

export async function addCompanyService(
  categoryId: string | null,
  keywords: string[]
): Promise<Result & { id?: string }> {
  const companyId = await requireCompanyId();
  if (!categoryId && keywords.length === 0) {
    return { ok: false, error: "Kies een categorie of voer zoekwoorden in." };
  }
  const [row] = await sql`
    INSERT INTO company_services (company_id, category_id, keywords)
    VALUES (${companyId}, ${categoryId}, ${keywords})
    RETURNING id
  `;
  revalidatePath("/settings");
  revalidatePath("/opportunities");
  return { ok: true, id: row.id as string };
}

export async function deleteCompanyService(serviceId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  const rows = await sql`SELECT company_id FROM company_services WHERE id = ${serviceId} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Dienst niet gevonden." };
  if (rows[0].company_id !== companyId) return { ok: false, error: "Geen toegang." };
  await sql`DELETE FROM company_services WHERE id = ${serviceId}`;
  revalidatePath("/settings");
  revalidatePath("/opportunities");
  return { ok: true };
}

export async function toggleCompanyService(serviceId: string, active: boolean): Promise<Result> {
  const companyId = await requireCompanyId();
  const rows = await sql`SELECT company_id FROM company_services WHERE id = ${serviceId} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Dienst niet gevonden." };
  if (rows[0].company_id !== companyId) return { ok: false, error: "Geen toegang." };
  await sql`UPDATE company_services SET active = ${active}, updated_at = now() WHERE id = ${serviceId}`;
  revalidatePath("/settings");
  revalidatePath("/opportunities");
  return { ok: true };
}

/* ────────────────── Service Areas ────────────────── */

export async function addServiceArea(
  input: {
    serviceId?: string;
    areaType: CompanyServiceArea["areaType"];
    municipality?: string;
    province?: string;
    radiusKm?: number;
    country?: string;
  }
): Promise<Result & { id?: string }> {
  const companyId = await requireCompanyId();
  const [row] = await sql`
    INSERT INTO company_service_areas (company_id, service_id, area_type, municipality, province, radius_km, country)
    VALUES (${companyId}, ${input.serviceId ?? null}, ${input.areaType}, ${input.municipality ?? null}, ${input.province ?? null}, ${input.radiusKm ?? null}, ${input.country ?? "Nederland"})
    RETURNING id
  `;
  revalidatePath("/settings");
  revalidatePath("/opportunities");
  return { ok: true, id: row.id as string };
}

export async function deleteServiceArea(areaId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  const rows = await sql`SELECT company_id FROM company_service_areas WHERE id = ${areaId} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Werkgebied niet gevonden." };
  if (rows[0].company_id !== companyId) return { ok: false, error: "Geen toegang." };
  await sql`DELETE FROM company_service_areas WHERE id = ${areaId}`;
  revalidatePath("/settings");
  revalidatePath("/opportunities");
  return { ok: true };
}

/* ────────────────── Opportunity Preferences ────────────────── */

export async function updateOpportunityPreferences(input: {
  minBudget?: number | null;
  maxDistanceKm?: number;
  minProjectSize?: string | null;
  maxProjectSize?: string | null;
  acceptsUrgent?: boolean;
  acceptsBusiness?: boolean;
  acceptsConsumer?: boolean;
  acceptsRecurring?: boolean;
  availabilityStatus?: AvailabilityStatus;
  availableFrom?: string | null;
  maxNotificationsPerDay?: number;
  notificationFrequency?: NotificationFrequency;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  active?: boolean;
}): Promise<Result> {
  const companyId = await requireCompanyId();

  const sets: string[] = [];
  const vals: unknown[] = [];
  let idx = 1;

  const add = (col: string, val: unknown) => {
    sets.push(`${col} = $${idx++}`);
    vals.push(val);
  };

  if (input.minBudget !== undefined) add("min_budget", input.minBudget);
  if (input.maxDistanceKm !== undefined) add("max_distance_km", input.maxDistanceKm);
  if (input.minProjectSize !== undefined) add("min_project_size", input.minProjectSize);
  if (input.maxProjectSize !== undefined) add("max_project_size", input.maxProjectSize);
  if (input.acceptsUrgent !== undefined) add("accepts_urgent", input.acceptsUrgent);
  if (input.acceptsBusiness !== undefined) add("accepts_business", input.acceptsBusiness);
  if (input.acceptsConsumer !== undefined) add("accepts_consumer", input.acceptsConsumer);
  if (input.acceptsRecurring !== undefined) add("accepts_recurring", input.acceptsRecurring);
  if (input.availabilityStatus !== undefined) add("availability_status", input.availabilityStatus);
  if (input.availableFrom !== undefined) add("available_from", input.availableFrom);
  if (input.maxNotificationsPerDay !== undefined) add("max_notifications_per_day", input.maxNotificationsPerDay);
  if (input.notificationFrequency !== undefined) add("notification_frequency", input.notificationFrequency);
  if (input.quietHoursStart !== undefined) add("quiet_hours_start", input.quietHoursStart);
  if (input.quietHoursEnd !== undefined) add("quiet_hours_end", input.quietHoursEnd);
  if (input.active !== undefined) add("active", input.active);

  if (sets.length === 0) return { ok: false, error: "Geen wijzigingen." };
  add("updated_at", new Date().toISOString());

  vals.push(companyId);
  const query = `UPDATE company_opportunity_preferences SET ${sets.join(", ")} WHERE company_id = $${idx}`;

  await sql.unsafe(query, vals as never[]);

  revalidatePath("/settings");
  revalidatePath("/opportunities");
  return { ok: true };
}

/* ────────────────── Opportunity Drafts ────────────────── */

export async function saveOpportunityDraft(
  draftId: string | null,
  data: Record<string, unknown>
): Promise<Result & { id?: string }> {
  const companyId = await requireCompanyId();
  const serialized = JSON.stringify(data);
  if (serialized.length > 30000) return { ok: false, error: "Dit concept is te groot om op te slaan." };
  if (draftId) {
    const rows = await sql`SELECT company_id FROM opportunity_drafts WHERE id = ${draftId} LIMIT 1`;
    if (rows.length === 0 || rows[0].company_id !== companyId) {
      return { ok: false, error: "Concept niet gevonden." };
    }
    await sql`UPDATE opportunity_drafts SET data = ${serialized}, updated_at = now() WHERE id = ${draftId}`;
    return { ok: true, id: draftId };
  }
  const [row] = await sql`
    INSERT INTO opportunity_drafts (company_id, data)
    VALUES (${companyId}, ${serialized})
    RETURNING id
  `;
  revalidatePath("/opportunities");
  return { ok: true, id: row.id as string };
}

export async function deleteOpportunityDraft(draftId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  const rows = await sql`SELECT company_id FROM opportunity_drafts WHERE id = ${draftId} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Concept niet gevonden." };
  if (rows[0].company_id !== companyId) return { ok: false, error: "Geen toegang." };
  await sql`DELETE FROM opportunity_drafts WHERE id = ${draftId}`;
  revalidatePath("/opportunities");
  return { ok: true };
}

/* ────────────────── Create Opportunity ────────────────── */

export async function createOpportunity(input: OpportunityInput): Promise<Result & { id?: string }> {
  const companyId = await requireCompanyId();
  const validated = validateOpportunityInput(input);
  if (!validated.ok || !validated.value) return { ok: false, error: validated.error };
  const value = validated.value;
  if (value.categoryId) {
    const category = await sql`SELECT 1 FROM service_categories WHERE id = ${value.categoryId} AND active = true LIMIT 1`;
    if (!category.length) return { ok: false, error: "De gekozen sector bestaat niet meer." };
  }

  const [row] = await sql`
    INSERT INTO opportunities (
      company_id, title, description, category_id,
      opportunity_type, urgency, budget_type, budget_min, budget_max,
      quantity, unit, location_type, municipality, province,
      start_date, end_date, response_deadline,
      recurrence_type, visibility_mode, status, published_at
    )
    VALUES (
      ${companyId}, ${value.title}, ${value.description ?? null}, ${value.categoryId ?? null},
      ${value.opportunityType}, ${value.urgency},
      ${value.budgetType}, ${value.budgetMin ?? null}, ${value.budgetMax ?? null},
      ${value.quantity ?? null}, ${value.unit ?? null},
      ${value.locationType}, ${value.municipality ?? null}, ${value.province ?? null},
      ${value.startDate ?? null}, ${value.endDate ?? null}, ${value.responseDeadline ?? null},
      ${value.recurrenceType}, ${value.visibilityMode},
      'active', now()
    )
    RETURNING id
  `;

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities`);

  // Trigger matching asynchronously (fire-and-forget)
  const oppId = row.id as string;
  runMatchingForOpportunity(oppId, 1, { minScore: 30, maxResults: 20 }).catch(() => {});

  return { ok: true, id: oppId };
}

export async function updateOpportunity(opportunityId: string, input: OpportunityInput): Promise<Result> {
  const companyId = await requireCompanyId();
  const owner = await sql`SELECT company_id FROM opportunities WHERE id = ${opportunityId} LIMIT 1`;
  if (!owner.length) return { ok: false, error: "Kans niet gevonden." };
  if (owner[0].company_id !== companyId) return { ok: false, error: "Je kunt alleen je eigen kans bewerken." };
  const validated = validateOpportunityInput(input);
  if (!validated.ok || !validated.value) return { ok: false, error: validated.error };
  const value = validated.value;
  if (value.categoryId) {
    const category = await sql`SELECT 1 FROM service_categories WHERE id = ${value.categoryId} AND active = true LIMIT 1`;
    if (!category.length) return { ok: false, error: "De gekozen sector bestaat niet meer." };
  }

  await sql`
    UPDATE opportunities SET
      title = ${value.title}, description = ${value.description ?? null}, category_id = ${value.categoryId ?? null},
      opportunity_type = ${value.opportunityType}, urgency = ${value.urgency},
      budget_type = ${value.budgetType}, budget_min = ${value.budgetMin ?? null}, budget_max = ${value.budgetMax ?? null},
      quantity = ${value.quantity ?? null}, unit = ${value.unit ?? null},
      location_type = ${value.locationType}, municipality = ${value.municipality ?? null}, province = ${value.province ?? null},
      start_date = ${value.startDate ?? null}, end_date = ${value.endDate ?? null}, response_deadline = ${value.responseDeadline ?? null},
      recurrence_type = ${value.recurrenceType}, visibility_mode = ${value.visibilityMode}, updated_at = now()
    WHERE id = ${opportunityId}
  `;
  await sql`
    INSERT INTO opportunity_audit_log (opportunity_id, event_type, metadata_json)
    VALUES (${opportunityId}, 'opportunity_updated', ${JSON.stringify({ fields: Object.keys(input) })})
  `;
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true };
}

export async function deleteOpportunity(opportunityId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  const deleted = await sql`
    DELETE FROM opportunities
    WHERE id = ${opportunityId} AND company_id = ${companyId}
    RETURNING id
  `;
  if (!deleted.length) return { ok: false, error: "Kans niet gevonden of geen toegang." };
  revalidatePath("/opportunities");
  return { ok: true };
}

export async function toggleOpportunitySaved(opportunityId: string): Promise<Result & { saved?: boolean }> {
  const companyId = await requireCompanyId();
  const opportunity = await sql`SELECT company_id, status, visibility_mode FROM opportunities WHERE id = ${opportunityId} LIMIT 1`;
  if (!opportunity.length) return { ok: false, error: "Kans niet gevonden." };
  if (opportunity[0].company_id === companyId) return { ok: false, error: "Je hoeft je eigen kans niet op te slaan." };
  if (opportunity[0].status === "draft" || opportunity[0].status === "paused") return { ok: false, error: "Deze kans is niet beschikbaar." };
  if (opportunity[0].visibility_mode === "matched_only") {
    const match = await sql`SELECT 1 FROM opportunity_matches WHERE opportunity_id = ${opportunityId} AND company_id = ${companyId} LIMIT 1`;
    if (!match.length) return { ok: false, error: "Geen toegang tot deze kans." };
  }

  const existing = await sql`
    SELECT id FROM opportunity_feedback
    WHERE opportunity_id = ${opportunityId} AND company_id = ${companyId} AND feedback_type = 'saved'
    LIMIT 1
  `;
  if (existing.length) {
    await sql`DELETE FROM opportunity_feedback WHERE id = ${existing[0].id}`;
    revalidatePath("/opportunities");
    revalidatePath(`/opportunities/${opportunityId}`);
    return { ok: true, saved: false };
  }
  await sql`
    INSERT INTO opportunity_feedback (opportunity_id, company_id, feedback_type)
    VALUES (${opportunityId}, ${companyId}, 'saved')
    ON CONFLICT (opportunity_id, company_id) DO UPDATE SET feedback_type = 'saved', reason = NULL, created_at = now()
  `;
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true, saved: true };
}

export async function markOpportunityOpened(opportunityId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  await sql`
    UPDATE opportunity_matches
    SET opened_at = COALESCE(opened_at, now()), status = CASE WHEN status IN ('pending', 'delivered') THEN 'opened' ELSE status END
    WHERE opportunity_id = ${opportunityId} AND company_id = ${companyId}
  `;
  return { ok: true };
}

export async function dismissOpportunity(opportunityId: string, reason?: string): Promise<Result> {
  const companyId = await requireCompanyId();
  const opportunity = await sql`
    SELECT o.company_id, o.status, o.visibility_mode,
           EXISTS(SELECT 1 FROM opportunity_matches m WHERE m.opportunity_id = o.id AND m.company_id = ${companyId}) AS matched
    FROM opportunities o WHERE o.id = ${opportunityId} LIMIT 1
  `;
  if (!opportunity.length) return { ok: false, error: "Kans niet gevonden." };
  if (opportunity[0].company_id === companyId) return { ok: false, error: "Dit is je eigen kans." };
  if (opportunity[0].status === "draft" || opportunity[0].status === "paused") return { ok: false, error: "Deze kans is niet beschikbaar." };
  if (opportunity[0].visibility_mode === "matched_only" && !opportunity[0].matched) return { ok: false, error: "Geen toegang tot deze kans." };
  await sql`
    UPDATE opportunity_matches SET dismissed_at = now(), status = 'not_relevant'
    WHERE opportunity_id = ${opportunityId} AND company_id = ${companyId}
  `;
  await sql`
    INSERT INTO opportunity_feedback (opportunity_id, company_id, feedback_type, reason)
    VALUES (${opportunityId}, ${companyId}, 'not_relevant', ${cleanText(reason, 200) ?? null})
    ON CONFLICT (opportunity_id, company_id) DO UPDATE SET feedback_type = 'not_relevant', reason = EXCLUDED.reason, created_at = now()
  `;
  revalidatePath("/opportunities");
  return { ok: true };
}

/* ────────────────── Expansion Round ────────────────── */

export async function triggerExpansionRound(opportunityId: string): Promise<Result & { matched?: number }> {
  const companyId = await requireCompanyId();
  const rows = await sql`SELECT company_id FROM opportunities WHERE id = ${opportunityId} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Aanvraag niet gevonden." };
  if (rows[0].company_id !== companyId) return { ok: false, error: "Geen toegang." };

  try {
    const result = await runExpansionRound(opportunityId);
    revalidatePath("/opportunities");
    revalidatePath(`/opportunities/${opportunityId}`);
    return { ok: true, matched: result.matched };
  } catch {
    return { ok: false, error: "Matching kon niet worden gestart." };
  }
}

/* ────────────────── Match Feedback ────────────────── */

export async function markMatchOpened(matchId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  const rows = await sql`SELECT company_id FROM opportunity_matches WHERE id = ${matchId} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Match niet gevonden." };
  if (rows[0].company_id !== companyId) return { ok: false, error: "Geen toegang." };
  await sql`UPDATE opportunity_matches SET opened_at = now(), status = 'opened' WHERE id = ${matchId} AND opened_at IS NULL`;
  revalidatePath("/opportunities");
  return { ok: true };
}

export async function dismissMatch(matchId: string, reason?: string): Promise<Result> {
  const companyId = await requireCompanyId();
  const rows = await sql`SELECT opportunity_id FROM opportunity_matches WHERE id = ${matchId} AND company_id = ${companyId} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Match niet gevonden." };
  const oppId = rows[0].opportunity_id as string;
  await sql`UPDATE opportunity_matches SET dismissed_at = now(), status = 'not_relevant' WHERE id = ${matchId}`;
  if (reason) {
    await sql`
      INSERT INTO opportunity_feedback (opportunity_id, company_id, feedback_type, reason)
      VALUES (${oppId}, ${companyId}, 'not_relevant', ${reason})
      ON CONFLICT (opportunity_id, company_id) DO UPDATE SET reason = EXCLUDED.reason
    `;
  }
  revalidatePath("/opportunities");
  return { ok: true };
}

/* ────────────────── Opportunity Response ────────────────── */

export async function respondToOpportunity(
  opportunityId: string,
  input: {
    message: string;
    priceType?: string;
    priceMin?: number;
    priceMax?: number;
    availableFrom?: string;
  }
): Promise<Result & { id?: string }> {
  const companyId = await requireCompanyId();
  const message = cleanLongText(input.message, 3000);
  if (!message || message.length < 20) return { ok: false, error: "Schrijf een korte toelichting van minimaal 20 tekens." };
  const priceMin = Number.isFinite(input.priceMin) && Number(input.priceMin) >= 0 ? Number(input.priceMin) : undefined;
  const priceMax = Number.isFinite(input.priceMax) && Number(input.priceMax) >= 0 ? Number(input.priceMax) : undefined;
  if (priceMin != null && priceMax != null && priceMax < priceMin) return { ok: false, error: "De maximumprijs moet hoger zijn dan de minimumprijs." };

  const opp = await sql`
    SELECT o.company_id, o.status, o.response_deadline, o.visibility_mode,
           EXISTS(SELECT 1 FROM opportunity_matches m WHERE m.opportunity_id = o.id AND m.company_id = ${companyId}) AS matched
    FROM opportunities o WHERE o.id = ${opportunityId} LIMIT 1
  `;
  if (opp.length === 0) return { ok: false, error: "Aanvraag niet gevonden." };
  if (opp[0].company_id === companyId) return { ok: false, error: "Dit is je eigen aanvraag." };
  if (!["active", "matching", "responses_received"].includes(opp[0].status as string)) return { ok: false, error: "Deze kans staat niet meer open voor reacties." };
  if (opp[0].response_deadline && new Date(opp[0].response_deadline as string).getTime() < Date.now()) return { ok: false, error: "De reactietermijn van deze kans is verlopen." };
  if (opp[0].visibility_mode === "matched_only" && !opp[0].matched) return { ok: false, error: "Deze kans is alleen beschikbaar voor gematchte bedrijven." };
  const priceType = BUDGET_TYPES.has(input.priceType as BudgetType) ? input.priceType as BudgetType : null;
  const availableDate = validDate(input.availableFrom) ?? null;

  const [row] = await sql`
    INSERT INTO opportunity_responses (opportunity_id, responding_company_id, message, price_type, price_min, price_max, available_from)
    VALUES (${opportunityId}, ${companyId}, ${message}, ${priceType}, ${priceMin ?? null}, ${priceMax ?? null}, ${availableDate})
    ON CONFLICT (opportunity_id, responding_company_id) DO UPDATE SET message = EXCLUDED.message, price_type = EXCLUDED.price_type, price_min = EXCLUDED.price_min, price_max = EXCLUDED.price_max, available_from = EXCLUDED.available_from, updated_at = now(), withdrawn_at = null
    RETURNING id
  `;

  await sql`UPDATE opportunity_matches SET status = 'interested' WHERE opportunity_id = ${opportunityId} AND company_id = ${companyId}`;
  await sql`UPDATE opportunities SET status = 'responses_received', updated_at = now() WHERE id = ${opportunityId} AND status IN ('active', 'matching')`;

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true, id: row.id as string };
}

/* ────────────────── Close Opportunity ────────────────── */

export async function closeOpportunity(
  opportunityId: string,
  outcome: "via_vynta" | "outside_vynta" | "not_yet" | "cancel"
): Promise<Result> {
  const companyId = await requireCompanyId();
  const rows = await sql`SELECT company_id FROM opportunities WHERE id = ${opportunityId} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Aanvraag niet gevonden." };
  if (rows[0].company_id !== companyId) return { ok: false, error: "Geen toegang." };

  if (outcome === "cancel") {
    await sql`UPDATE opportunities SET status = 'cancelled', closed_at = now() WHERE id = ${opportunityId}`;
  } else if (outcome === "via_vynta") {
    await sql`UPDATE opportunities SET status = 'completed', closed_at = now() WHERE id = ${opportunityId}`;
  } else if (outcome === "outside_vynta") {
    await sql`UPDATE opportunities SET status = 'completed', closed_at = now() WHERE id = ${opportunityId}`;
  } else {
    await sql`UPDATE opportunities SET status = 'active' WHERE id = ${opportunityId}`;
  }

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true };
}

/* ────────────────── Ask Question ────────────────── */

export async function askQuestion(
  opportunityId: string,
  question: string
): Promise<Result & { id?: string }> {
  const companyId = await requireCompanyId();
  const cleanQuestion = cleanLongText(question, 1000);
  if (!cleanQuestion || cleanQuestion.length < 10) return { ok: false, error: "Maak je vraag iets duidelijker." };

  const opp = await sql`
    SELECT o.company_id, o.status, o.response_deadline, o.visibility_mode,
           EXISTS(SELECT 1 FROM opportunity_matches m WHERE m.opportunity_id = o.id AND m.company_id = ${companyId}) AS matched
    FROM opportunities o WHERE o.id = ${opportunityId} LIMIT 1
  `;
  if (opp.length === 0) return { ok: false, error: "Aanvraag niet gevonden." };
  if (opp[0].company_id === companyId) return { ok: false, error: "Dit is je eigen aanvraag." };
  if (!["active", "matching", "responses_received"].includes(opp[0].status as string)) return { ok: false, error: "Deze kans is niet meer actief." };
  if (opp[0].response_deadline && new Date(opp[0].response_deadline as string).getTime() < Date.now()) return { ok: false, error: "De reactietermijn is verlopen." };
  if (opp[0].visibility_mode === "matched_only" && !opp[0].matched) return { ok: false, error: "Geen toegang tot deze kans." };

  const [row] = await sql`
    INSERT INTO opportunity_questions (opportunity_id, asked_by_company_id)
    VALUES (${opportunityId}, ${companyId})
    RETURNING id
  `;

  // Also create a response with status 'question'
  await sql`
    INSERT INTO opportunity_responses (opportunity_id, responding_company_id, status, message)
    VALUES (${opportunityId}, ${companyId}, 'question', ${cleanQuestion})
    ON CONFLICT (opportunity_id, responding_company_id) DO UPDATE SET message = EXCLUDED.message, status = 'question', updated_at = now(), withdrawn_at = null
  `;

  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true, id: row.id as string };
}

/* ────────────────── Update Opportunity Status ────────────────── */

export async function updateOpportunityStatus(
  opportunityId: string,
  status: string
): Promise<Result> {
  const companyId = await requireCompanyId();
  const rows = await sql`SELECT company_id FROM opportunities WHERE id = ${opportunityId} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Aanvraag niet gevonden." };
  if (rows[0].company_id !== companyId) return { ok: false, error: "Geen toegang." };

  const validStatuses = ["active", "paused", "matching", "responses_received", "in_conversation", "party_selected", "preparing_deal", "completed", "cancelled", "expired"];
  if (!validStatuses.includes(status)) return { ok: false, error: "Ongeldige status." };

  const closedAt = status === "completed" || status === "cancelled" || status === "expired" ? new Date().toISOString() : null;

  await sql`
    UPDATE opportunities SET
      status = ${status},
      closed_at = ${closedAt},
      published_at = CASE WHEN ${status} = 'active' THEN COALESCE(published_at, now()) ELSE published_at END,
      updated_at = now()
    WHERE id = ${opportunityId}
  `;

  // Audit log
  await sql`
    INSERT INTO opportunity_audit_log (opportunity_id, event_type, metadata_json)
    VALUES (${opportunityId}, ${`status_changed_to_${status}`}, ${JSON.stringify({ status })})
  `;

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true };
}

/* ────────────────── Select Response ────────────────── */

export async function updateOpportunityResponseStatus(
  opportunityId: string,
  responseId: string,
  status: Extract<ResponseStatus, "shortlisted" | "selected" | "not_selected">
): Promise<Result> {
  const companyId = await requireCompanyId();
  if (!["shortlisted", "selected", "not_selected"].includes(status)) return { ok: false, error: "Ongeldige reactiestatus." };
  const rows = await sql`
    SELECT response.id, response.status
    FROM opportunity_responses response
    JOIN opportunities opportunity ON opportunity.id = response.opportunity_id
    WHERE response.id = ${responseId} AND response.opportunity_id = ${opportunityId} AND opportunity.company_id = ${companyId}
    LIMIT 1
  `;
  if (!rows.length) return { ok: false, error: "Reactie niet gevonden of geen toegang." };
  if (rows[0].status === "question") return { ok: false, error: "Een vraag kan niet als zakelijke reactie worden beoordeeld." };

  if (status === "selected") {
    await sql`UPDATE opportunity_responses SET status = 'selected', updated_at = now() WHERE id = ${responseId}`;
    await sql`UPDATE opportunity_responses SET status = 'not_selected', updated_at = now() WHERE opportunity_id = ${opportunityId} AND id <> ${responseId} AND status <> 'question'`;
    await sql`UPDATE opportunities SET status = 'party_selected', updated_at = now() WHERE id = ${opportunityId}`;
  } else {
    await sql`UPDATE opportunity_responses SET status = ${status}, updated_at = now() WHERE id = ${responseId}`;
  }
  await sql`
    INSERT INTO opportunity_audit_log (opportunity_id, event_type, metadata_json)
    VALUES (${opportunityId}, ${`response_${status}`}, ${JSON.stringify({ responseId })})
  `;
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true };
}

export async function startOpportunityConversation(
  opportunityId: string,
  targetCompanyId: string
): Promise<Result & { conversationId?: string }> {
  const companyId = await requireCompanyId();
  const rows = await sql`
    SELECT o.title
    FROM opportunities o
    JOIN opportunity_responses response ON response.opportunity_id = o.id AND response.responding_company_id = ${targetCompanyId} AND response.withdrawn_at IS NULL
    WHERE o.id = ${opportunityId} AND o.company_id = ${companyId}
    LIMIT 1
  `;
  if (!rows.length) return { ok: false, error: "Je kunt alleen een gesprek starten met een bedrijf dat heeft gereageerd." };

  const existing = await sql`
    SELECT conversation.id
    FROM conversations conversation
    JOIN conversation_participants mine ON mine.conversation_id = conversation.id AND mine.company_id = ${companyId}
    JOIN conversation_participants other ON other.conversation_id = conversation.id AND other.company_id = ${targetCompanyId}
    LIMIT 1
  `;
  let conversationId = existing[0]?.id as string | undefined;
  if (!conversationId) {
    const created = await sql`INSERT INTO conversations DEFAULT VALUES RETURNING id`;
    conversationId = created[0].id as string;
    await sql`INSERT INTO conversation_participants (conversation_id, company_id) VALUES (${conversationId}, ${companyId}), (${conversationId}, ${targetCompanyId})`;
    await sql`
      INSERT INTO messages (conversation_id, sender_company_id, kind, body, status)
      VALUES (${conversationId}, ${companyId}, 'system', ${`Gesprek gestart vanuit de kans “${rows[0].title as string}”.`}, 'sent')
    `;
  }
  return { ok: true, conversationId };
}

export async function selectResponse(
  opportunityId: string,
  responseId: string
): Promise<Result> {
  return updateOpportunityResponseStatus(opportunityId, responseId, "selected");
}

/* ────────────────── Withdraw Response ────────────────── */

export async function withdrawResponse(opportunityId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  await sql`
    UPDATE opportunity_responses SET withdrawn_at = now(), status = 'withdrawn'
    WHERE opportunity_id = ${opportunityId} AND responding_company_id = ${companyId}
  `;
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true };
}

/* ────────────────── Get Opportunity Stats ────────────────── */

export async function getOpportunityStats(opportunityId: string): Promise<{
  matchCount: number;
  responseCount: number;
  questionCount: number;
  openedCount: number;
  interestedCount: number;
}> {
  const companyId = await requireCompanyId();
  const rows = await sql`SELECT company_id FROM opportunities WHERE id = ${opportunityId} LIMIT 1`;
  if (rows.length === 0 || rows[0].company_id !== companyId) {
    return { matchCount: 0, responseCount: 0, questionCount: 0, openedCount: 0, interestedCount: 0 };
  }

  const [m, r, q, o, i] = await Promise.all([
    sql`SELECT count(*)::int AS n FROM opportunity_matches WHERE opportunity_id = ${opportunityId}`,
    sql`SELECT count(*)::int AS n FROM opportunity_responses WHERE opportunity_id = ${opportunityId} AND withdrawn_at IS NULL`,
    sql`SELECT count(*)::int AS n FROM opportunity_questions WHERE opportunity_id = ${opportunityId}`,
    sql`SELECT count(*)::int AS n FROM opportunity_matches WHERE opportunity_id = ${opportunityId} AND opened_at IS NOT NULL`,
    sql`SELECT count(*)::int AS n FROM opportunity_matches WHERE opportunity_id = ${opportunityId} AND status = 'interested'`,
  ]);

  return {
    matchCount: m[0].n as number,
    responseCount: r[0].n as number,
    questionCount: q[0].n as number,
    openedCount: o[0].n as number,
    interestedCount: i[0].n as number,
  };
}
