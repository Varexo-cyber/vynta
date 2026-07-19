"use server";

import { sql } from "./db";
import { requireCompanyId } from "./auth";
import { searchKnowledgeBase, searchKnowledgeBaseWithIntent, normalizeText, getArticleById } from "./help-knowledge";
import { CHECKLIST_TASKS } from "./help-checklist";
import { classifyIntent, isCorrection, type ConversationTurn } from "./help-intent";
import type { Company } from "./types";

type Result = { ok: boolean; error?: string };

/* ----------------------------- Onboarding ----------------------------- */

export async function getOnboardingState(): Promise<{
  status: string;
  step: number;
  goals: string[];
  experienceLevel: string;
}> {
  const companyId = await requireCompanyId();
  const rows = await sql`
    SELECT status, step, goals, experience_level
    FROM onboarding_state WHERE company_id = ${companyId}
  `;
  if (rows.length === 0) {
    return { status: "pending", step: 0, goals: [], experienceLevel: "normal" };
  }
  const r = rows[0];
  return {
    status: r.status as string,
    step: r.step as number,
    goals: (r.goals as string[]) ?? [],
    experienceLevel: (r.experience_level as string) ?? "normal",
  };
}

export async function updateOnboardingStep(step: number): Promise<Result> {
  const companyId = await requireCompanyId();
  await sql`
    INSERT INTO onboarding_state (company_id, status, step, updated_at)
    VALUES (${companyId}, 'in_progress', ${step}, now())
    ON CONFLICT (company_id) DO UPDATE
    SET step = ${step}, status = 'in_progress', updated_at = now()
  `;
  return { ok: true };
}

export async function completeOnboarding(goals: string[], experienceLevel: string): Promise<Result> {
  const companyId = await requireCompanyId();
  await sql`
    INSERT INTO onboarding_state (company_id, status, step, goals, experience_level, completed_at, updated_at)
    VALUES (${companyId}, 'completed', 999, ${goals}, ${experienceLevel}, now(), now())
    ON CONFLICT (company_id) DO UPDATE
    SET status = 'completed', goals = ${goals}, experience_level = ${experienceLevel},
        completed_at = now(), updated_at = now()
  `;
  return { ok: true };
}

export async function skipOnboarding(): Promise<Result> {
  const companyId = await requireCompanyId();
  await sql`
    INSERT INTO onboarding_state (company_id, status, updated_at)
    VALUES (${companyId}, 'skipped', now())
    ON CONFLICT (company_id) DO UPDATE
    SET status = 'skipped', updated_at = now()
  `;
  return { ok: true };
}

/* ----------------------------- Checklist ----------------------------- */

export async function getChecklistState(): Promise<{
  completed: string[];
  hidden: boolean;
}> {
  const companyId = await requireCompanyId();
  const [doneRows, hiddenRows] = await Promise.all([
    sql`SELECT task_id FROM checklist_progress WHERE company_id = ${companyId} AND completed = true`,
    sql`SELECT 1 FROM checklist_hidden WHERE company_id = ${companyId} LIMIT 1`,
  ]);
  return {
    completed: doneRows.map((r) => r.task_id as string),
    hidden: hiddenRows.length > 0,
  };
}

export async function completeChecklistTask(taskId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  await sql`
    INSERT INTO checklist_progress (company_id, task_id, completed, completed_at)
    VALUES (${companyId}, ${taskId}, true, now())
    ON CONFLICT (company_id, task_id) DO UPDATE
    SET completed = true, completed_at = now()
  `;
  return { ok: true };
}

export async function hideChecklist(): Promise<Result> {
  const companyId = await requireCompanyId();
  await sql`
    INSERT INTO checklist_hidden (company_id) VALUES (${companyId})
    ON CONFLICT (company_id) DO NOTHING
  `;
  return { ok: true };
}

export async function showChecklist(): Promise<Result> {
  const companyId = await requireCompanyId();
  await sql`DELETE FROM checklist_hidden WHERE company_id = ${companyId}`;
  return { ok: true };
}

/* ----------------------------- Tour state ----------------------------- */

export async function getTourState(tourId: string): Promise<{
  status: string;
  currentStep: number;
}> {
  const companyId = await requireCompanyId();
  const rows = await sql`
    SELECT status, current_step FROM tour_state
    WHERE company_id = ${companyId} AND tour_id = ${tourId}
  `;
  if (rows.length === 0) return { status: "not_started", currentStep: 0 };
  return {
    status: rows[0].status as string,
    currentStep: rows[0].current_step as number,
  };
}

export async function updateTourProgress(tourId: string, step: number): Promise<Result> {
  const companyId = await requireCompanyId();
  await sql`
    INSERT INTO tour_state (company_id, tour_id, status, current_step, started_at)
    VALUES (${companyId}, ${tourId}, 'in_progress', ${step}, now())
    ON CONFLICT (company_id, tour_id) DO UPDATE
    SET status = 'in_progress', current_step = ${step}
  `;
  return { ok: true };
}

export async function completeTour(tourId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  await sql`
    INSERT INTO tour_state (company_id, tour_id, status, current_step, completed_at, started_at)
    VALUES (${companyId}, ${tourId}, 'completed', 999, now(), now())
    ON CONFLICT (company_id, tour_id) DO UPDATE
    SET status = 'completed', completed_at = now()
  `;
  return { ok: true };
}

export async function skipTour(tourId: string): Promise<Result> {
  const companyId = await requireCompanyId();
  await sql`
    INSERT INTO tour_state (company_id, tour_id, status, started_at)
    VALUES (${companyId}, ${tourId}, 'skipped', now())
    ON CONFLICT (company_id, tour_id) DO UPDATE
    SET status = 'skipped'
  `;
  return { ok: true };
}

/* ----------------------------- Help feedback ----------------------------- */

export async function submitHelpFeedback(
  articleId: string | null,
  query: string,
  helpful: boolean,
  reason?: string
): Promise<Result> {
  const companyId = await requireCompanyId();
  await sql`
    INSERT INTO help_feedback (company_id, article_id, query, helpful, reason)
    VALUES (${companyId}, ${articleId}, ${query}, ${helpful}, ${reason ?? null})
  `;
  return { ok: true };
}

/* ----------------------------- Help queries logging ----------------------------- */

export async function logHelpQuery(
  query: string,
  matchedArticleId: string | null,
  contextRoute?: string
): Promise<Result> {
  const companyId = await requireCompanyId();
  await sql`
    INSERT INTO help_queries (company_id, query, matched_article_id, found_match, context_route)
    VALUES (${companyId}, ${query}, ${matchedArticleId}, ${matchedArticleId !== null}, ${contextRoute ?? null})
  `;
  return { ok: true };
}

/* ----------------------------- Help preferences ----------------------------- */

export async function getHelpPreferences(): Promise<{
  assistantEnabled: boolean;
  productTipsEnabled: boolean;
  experienceLevel: string;
}> {
  const companyId = await requireCompanyId();
  const rows = await sql`
    SELECT assistant_enabled, product_tips_enabled, experience_level
    FROM help_preferences WHERE company_id = ${companyId}
  `;
  if (rows.length === 0) {
    return { assistantEnabled: true, productTipsEnabled: true, experienceLevel: "normal" };
  }
  const r = rows[0];
  return {
    assistantEnabled: r.assistant_enabled as boolean,
    productTipsEnabled: r.product_tips_enabled as boolean,
    experienceLevel: (r.experience_level as string) ?? "normal",
  };
}

export async function updateHelpPreferences(prefs: {
  assistantEnabled?: boolean;
  productTipsEnabled?: boolean;
  experienceLevel?: string;
}): Promise<Result> {
  const companyId = await requireCompanyId();
  const ae = prefs.assistantEnabled ?? true;
  const pt = prefs.productTipsEnabled ?? true;
  const el = prefs.experienceLevel ?? 'normal';
  await sql`
    INSERT INTO help_preferences (company_id, assistant_enabled, product_tips_enabled, experience_level, updated_at)
    VALUES (${companyId}, ${ae}, ${pt}, ${el}, now())
    ON CONFLICT (company_id) DO UPDATE
    SET
      assistant_enabled = ${ae},
      product_tips_enabled = ${pt},
      experience_level = ${el},
      updated_at = now()
  `;
  return { ok: true };
}

/* ----------------------------- Auto-detect checklist ----------------------------- */

export async function getChecklistAutoDetect(
  company: Company,
  myNetworks: { id: string; type: string }[],
  hasPosted: boolean,
  hasFollowed: boolean,
  hasConversed: boolean
): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};

  for (const task of CHECKLIST_TASKS) {
    if (!task.detectKey) continue;
    switch (task.detectKey) {
      case "hasLogo":
        result.hasLogo = !!company.logoUrl;
        break;
      case "hasDescription":
        result.hasDescription = !!company.description && company.description.trim().length > 0;
        break;
      case "hasContact":
        result.hasContact = !!(company.phone && company.email);
        break;
      case "hasMunicipalityNetwork":
        result.hasMunicipalityNetwork = myNetworks.some((n) => n.type === "municipality");
        break;
      case "hasProvinceNetwork":
        result.hasProvinceNetwork = myNetworks.some((n) => n.type === "province");
        break;
      case "hasIndustryNetwork":
        result.hasIndustryNetwork = myNetworks.some((n) => n.type === "industry");
        break;
      case "hasPosted":
        result.hasPosted = hasPosted;
        break;
      case "hasFollowed":
        result.hasFollowed = hasFollowed;
        break;
      case "hasConversed":
        result.hasConversed = hasConversed;
        break;
    }
  }

  return result;
}

/* ----------------------------- Assistant query ----------------------------- */

export async function processAssistantQuery(
  query: string,
  contextRoute?: string,
  conversationHistory?: ConversationTurn[]
): Promise<{
  answer: string;
  articleId: string | null;
  steps?: string[];
  actions?: string[];
  tourId?: string;
  found: boolean;
  clarificationOptions?: { label: string; query: string }[];
}> {
  // 1. Classify intent with conversation context
  const intentMatch = classifyIntent(query, contextRoute, conversationHistory);

  // 2. If needs clarification (ambiguous feed vs private message)
  if (intentMatch.needsClarification && intentMatch.clarificationOptions) {
    return {
      answer: "Bedoel je een openbare post op de feed of een privébericht aan één bedrijf?",
      articleId: null,
      found: true,
      clarificationOptions: intentMatch.clarificationOptions.map((opt) => ({
        label: opt.label,
        query: opt.label === "Post op de feed"
          ? "Ik wil een openbare post op de feed plaatsen"
          : "Ik wil een privébericht sturen naar een bedrijf",
      })),
    };
  }

  // 3. Find previously given answers to penalize on correction
  const penalizeArticleIds: string[] = [];
  if (intentMatch.isCorrection && conversationHistory && conversationHistory.length > 0) {
    // Find the last assistant answer's article ID
    const lastAssistant = [...conversationHistory].reverse().find((m) => m.role === "assistant");
    if (lastAssistant) {
      // Try to match the answer text to an article
      const lastAnswerNorm = normalizeText(lastAssistant.text);
      for (const article of searchKnowledgeBase(lastAssistant.text)) {
        if (normalizeText(article.answer) === lastAnswerNorm) {
          penalizeArticleIds.push(article.id);
          break;
        }
      }
    }
  }

  // 4. Search knowledge base with intent and penalties
  const results = searchKnowledgeBaseWithIntent(
    query,
    intentMatch.articleId,
    penalizeArticleIds
  );

  // 5. If intent is clear but article not in results, inject it
  if (intentMatch.articleId && intentMatch.confidence > 0.4) {
    const inResults = results.find((r) => r.id === intentMatch.articleId);
    if (!inResults) {
      const article = getArticleById(intentMatch.articleId);
      if (article) {
        results.unshift(article);
      }
    }
  }

  const top = results[0];

  // 6. Log non-blocking
  try {
    await logHelpQuery(query, top?.id ?? null, contextRoute);
  } catch {
    // Logging is best-effort; ignore errors
  }

  // 7. No result found
  if (!top) {
    return {
      answer:
        "Ik kon hier nog geen betrouwbare uitleg voor vinden. Probeer je vraag anders te formuleren of bekijk het Helpcentrum.",
      articleId: null,
      found: false,
      actions: ["OPEN_HELP_CENTER"],
    };
  }

  // 8. Build answer — acknowledge correction if detected
  let answer = top.answer;
  if (intentMatch.isCorrection) {
    answer = `Begrepen — ${answer}`;
  }

  return {
    answer,
    articleId: top.id,
    steps: top.steps,
    actions: top.actions,
    tourId: top.tourId,
    found: true,
  };
}
