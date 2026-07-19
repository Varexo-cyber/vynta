"use server";

import { sql } from "./db";
import { requirePlatformAdmin } from "./auth";

/* ----------------------------- Admin dashboard data ----------------------------- */

export interface ImprovementQueueItem {
  id: string;
  questionCluster: string;
  exampleQuestions: string[];
  currentAnswer: string | null;
  currentArticleId: string | null;
  failureReason: string | null;
  negativeFeedbackCount: number;
  correctionCount: number;
  status: string;
  createdAt: string;
}

export interface DashboardStats {
  totalQueries: number;
  totalFeedback: number;
  negativeFeedback: number;
  positiveFeedback: number;
  successRate: number;
  openImprovements: number;
  topQuestions: { query: string; count: number }[];
  topNegativeArticles: { articleId: string; count: number }[];
  confusedIntents: { intent: string; count: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await requirePlatformAdmin();

  const statsRows = await sql`
    SELECT
      (SELECT COUNT(*) FROM help_queries) as total_queries,
      (SELECT COUNT(*) FROM assistant_feedback) as total_feedback,
      (SELECT COUNT(*) FROM assistant_feedback WHERE helpful = false) as negative_feedback,
      (SELECT COUNT(*) FROM assistant_feedback WHERE helpful = true) as positive_feedback,
      (SELECT COUNT(*) FROM assistant_improvement_queue WHERE status = 'open') as open_improvements
  `;
  const s = statsRows[0];
  const totalFeedback = Number(s.total_feedback);
  const negativeFeedback = Number(s.negative_feedback);
  const successRate = totalFeedback > 0 ? Math.round((Number(s.positive_feedback) / totalFeedback) * 100) : 0;

  const topQuestions = await sql`
    SELECT query, COUNT(*) as count FROM help_queries
    GROUP BY query ORDER BY count DESC LIMIT 10
  `;
  const topNegativeArticles = await sql`
    SELECT article_id, COUNT(*) as count FROM assistant_feedback
    WHERE helpful = false AND article_id IS NOT NULL
    GROUP BY article_id ORDER BY count DESC LIMIT 10
  `;
  const confusedIntents = await sql`
    SELECT intent, COUNT(*) as count FROM assistant_feedback
    WHERE helpful = false AND intent IS NOT NULL
    GROUP BY intent ORDER BY count DESC LIMIT 10
  `;

  return {
    totalQueries: Number(s.total_queries),
    totalFeedback,
    negativeFeedback,
    positiveFeedback: Number(s.positive_feedback),
    successRate,
    openImprovements: Number(s.open_improvements),
    topQuestions: topQuestions.map((r) => ({ query: r.query as string, count: Number(r.count) })),
    topNegativeArticles: topNegativeArticles.map((r) => ({ articleId: r.article_id as string, count: Number(r.count) })),
    confusedIntents: confusedIntents.map((r) => ({ intent: r.intent as string, count: Number(r.count) })),
  };
}

export async function getImprovementQueue(): Promise<ImprovementQueueItem[]> {
  await requirePlatformAdmin();

  const rows = await sql`
    SELECT id, question_cluster, example_questions, current_answer, current_article_id,
           failure_reason, negative_feedback_count, correction_count, status, created_at
    FROM assistant_improvement_queue
    WHERE status = 'open'
    ORDER BY negative_feedback_count DESC, created_at DESC
    LIMIT 50
  `;
  return rows.map((r) => ({
    id: r.id as string,
    questionCluster: r.question_cluster as string,
    exampleQuestions: r.example_questions as string[],
    currentAnswer: r.current_answer as string | null,
    currentArticleId: r.current_article_id as string | null,
    failureReason: r.failure_reason as string | null,
    negativeFeedbackCount: Number(r.negative_feedback_count),
    correctionCount: Number(r.correction_count),
    status: r.status as string,
    createdAt: new Date(r.created_at as string).toISOString(),
  }));
}

export async function resolveImprovementItem(
  id: string,
  resolvedAnswer: string,
  resolvedArticleId: string | null
): Promise<{ ok: boolean }> {
  await requirePlatformAdmin();

  await sql`
    UPDATE assistant_improvement_queue
    SET status = 'resolved', resolved_answer = ${resolvedAnswer}, resolved_article_id = ${resolvedArticleId},
        resolved_at = now(), updated_at = now()
    WHERE id = ${id}
  `;
  return { ok: true };
}

export async function blockImprovementItem(id: string): Promise<{ ok: boolean }> {
  await requirePlatformAdmin();

  await sql`
    UPDATE assistant_improvement_queue
    SET status = 'blocked', updated_at = now()
    WHERE id = ${id}
  `;
  return { ok: true };
}
