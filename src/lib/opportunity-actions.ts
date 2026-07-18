"use server";

import { revalidatePath } from "next/cache";
import { sql } from "./db";
import { requireCompanyId } from "./auth";
import { runMatchingForOpportunity, runExpansionRound } from "./opportunity-matching";
import type {
  AvailabilityStatus,
  NotificationFrequency,
  CompanyServiceArea,
} from "./types";

type Result = { ok: boolean; error?: string };

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
  if (draftId) {
    const rows = await sql`SELECT company_id FROM opportunity_drafts WHERE id = ${draftId} LIMIT 1`;
    if (rows.length === 0 || rows[0].company_id !== companyId) {
      return { ok: false, error: "Concept niet gevonden." };
    }
    await sql`UPDATE opportunity_drafts SET data = ${JSON.stringify(data)}, updated_at = now() WHERE id = ${draftId}`;
    return { ok: true, id: draftId };
  }
  const [row] = await sql`
    INSERT INTO opportunity_drafts (company_id, data)
    VALUES (${companyId}, ${JSON.stringify(data)})
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

export async function createOpportunity(input: {
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
}): Promise<Result & { id?: string }> {
  const companyId = await requireCompanyId();
  const title = input.title.trim();
  if (!title) return { ok: false, error: "Titel is verplicht." };

  const [row] = await sql`
    INSERT INTO opportunities (
      company_id, title, description, category_id,
      opportunity_type, urgency, budget_type, budget_min, budget_max,
      quantity, unit, location_type, municipality, province,
      start_date, end_date, response_deadline,
      recurrence_type, visibility_mode, status, published_at
    )
    VALUES (
      ${companyId}, ${title}, ${input.description ?? null}, ${input.categoryId ?? null},
      ${input.opportunityType ?? "request"}, ${input.urgency ?? "normal"},
      ${input.budgetType ?? "open"}, ${input.budgetMin ?? null}, ${input.budgetMax ?? null},
      ${input.quantity ?? null}, ${input.unit ?? null},
      ${input.locationType ?? "on_site"}, ${input.municipality ?? null}, ${input.province ?? null},
      ${input.startDate ?? null}, ${input.endDate ?? null}, ${input.responseDeadline ?? null},
      ${input.recurrenceType ?? "one_time"}, ${input.visibilityMode ?? "matched_only"},
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
  if (!input.message.trim()) return { ok: false, error: "Bericht is verplicht." };

  const opp = await sql`SELECT company_id FROM opportunities WHERE id = ${opportunityId} LIMIT 1`;
  if (opp.length === 0) return { ok: false, error: "Aanvraag niet gevonden." };
  if (opp[0].company_id === companyId) return { ok: false, error: "Dit is je eigen aanvraag." };

  const [row] = await sql`
    INSERT INTO opportunity_responses (opportunity_id, responding_company_id, message, price_type, price_min, price_max, available_from)
    VALUES (${opportunityId}, ${companyId}, ${input.message.trim()}, ${input.priceType ?? null}, ${input.priceMin ?? null}, ${input.priceMax ?? null}, ${input.availableFrom ?? null})
    ON CONFLICT (opportunity_id, responding_company_id) DO UPDATE SET message = EXCLUDED.message, price_type = EXCLUDED.price_type, price_min = EXCLUDED.price_min, price_max = EXCLUDED.price_max, available_from = EXCLUDED.available_from, updated_at = now(), withdrawn_at = null
    RETURNING id
  `;

  await sql`UPDATE opportunity_matches SET status = 'interested' WHERE opportunity_id = ${opportunityId} AND company_id = ${companyId}`;

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
  if (!question.trim()) return { ok: false, error: "Stel een vraag." };

  const opp = await sql`SELECT company_id FROM opportunities WHERE id = ${opportunityId} LIMIT 1`;
  if (opp.length === 0) return { ok: false, error: "Aanvraag niet gevonden." };
  if (opp[0].company_id === companyId) return { ok: false, error: "Dit is je eigen aanvraag." };

  const [row] = await sql`
    INSERT INTO opportunity_questions (opportunity_id, asked_by_company_id)
    VALUES (${opportunityId}, ${companyId})
    RETURNING id
  `;

  // Also create a response with status 'question'
  await sql`
    INSERT INTO opportunity_responses (opportunity_id, responding_company_id, status, message)
    VALUES (${opportunityId}, ${companyId}, 'question', ${question.trim()})
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

  const validStatuses = ["active", "matching", "responses_received", "in_conversation", "party_selected", "preparing_deal", "completed", "cancelled", "expired"];
  if (!validStatuses.includes(status)) return { ok: false, error: "Ongeldige status." };

  const closedAt = status === "completed" || status === "cancelled" || status === "expired" ? new Date().toISOString() : null;

  await sql`
    UPDATE opportunities SET status = ${status}, closed_at = COALESCE(${closedAt}, closed_at), updated_at = now()
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

export async function selectResponse(
  opportunityId: string,
  responseId: string
): Promise<Result> {
  const companyId = await requireCompanyId();
  const rows = await sql`SELECT company_id FROM opportunities WHERE id = ${opportunityId} LIMIT 1`;
  if (rows.length === 0) return { ok: false, error: "Aanvraag niet gevonden." };
  if (rows[0].company_id !== companyId) return { ok: false, error: "Geen toegang." };

  // Mark selected response
  await sql`UPDATE opportunity_responses SET status = 'selected' WHERE id = ${responseId} AND opportunity_id = ${opportunityId}`;
  // Mark others as not_selected
  await sql`UPDATE opportunity_responses SET status = 'not_selected' WHERE opportunity_id = ${opportunityId} AND id != ${responseId}`;
  // Update opportunity status
  await sql`UPDATE opportunities SET status = 'party_selected', updated_at = now() WHERE id = ${opportunityId}`;

  // Audit log
  await sql`
    INSERT INTO opportunity_audit_log (opportunity_id, event_type, metadata_json)
    VALUES (${opportunityId}, 'response_selected', ${JSON.stringify({ responseId })})
  `;

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  return { ok: true };
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
