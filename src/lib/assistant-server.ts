"use server";

import { sql } from "./db";
import { requireCompanyId, getSession } from "./auth";
import { classifyIntent, isCorrection, type ConversationTurn } from "./help-intent";
import { searchKnowledgeBaseWithIntent, getArticleById, normalizeText } from "./help-knowledge";
import { logHelpQuery } from "./help-actions-server";

/* ----------------------------- Types ----------------------------- */

export interface AssistantConversation {
  id: string;
  title: string;
  summary: string | null;
  lastIntent: string | null;
  status: string;
  contextRoute: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantMessageDB {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  intent: string | null;
  confidence: number | null;
  source: string | null;
  actionId: string | null;
  articleId: string | null;
  feedbackHelpful: boolean | null;
  feedbackReason: string | null;
  feedbackCorrection: string | null;
  createdAt: string;
}

export interface AssistantMemory {
  id: string;
  memoryKey: string;
  memoryValue: string;
  userConfirmed: boolean;
  createdAt: string;
}

/* ----------------------------- Conversation CRUD ----------------------------- */

export async function createConversation(contextRoute?: string): Promise<string> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const companyId = session.company.id;
  const userId = session.userId;

  const rows = await sql`
    INSERT INTO assistant_conversations (company_id, user_id, context_route)
    VALUES (${companyId}, ${userId}, ${contextRoute ?? null})
    RETURNING id
  `;
  return rows[0].id as string;
}

export async function listConversations(): Promise<AssistantConversation[]> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const companyId = session.company.id;
  const userId = session.userId;

  const rows = await sql`
    SELECT id, title, summary, last_intent, status, context_route, created_at, updated_at
    FROM assistant_conversations
    WHERE company_id = ${companyId} AND user_id = ${userId} AND status != 'deleted'
    ORDER BY updated_at DESC
    LIMIT 50
  `;
  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    summary: r.summary as string | null,
    lastIntent: r.last_intent as string | null,
    status: r.status as string,
    contextRoute: r.context_route as string | null,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  }));
}

export async function getConversationMessages(conversationId: string): Promise<AssistantMessageDB[]> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const companyId = session.company.id;
  const userId = session.userId;

  // Verify ownership
  const conv = await sql`
    SELECT id FROM assistant_conversations
    WHERE id = ${conversationId} AND company_id = ${companyId} AND user_id = ${userId}
  `;
  if (conv.length === 0) throw new Error("NOT_FOUND");

  const rows = await sql`
    SELECT id, conversation_id, role, content, intent, confidence, source, action_id, article_id,
           feedback_helpful, feedback_reason, feedback_correction, created_at
    FROM assistant_messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
  `;
  return rows.map((r) => ({
    id: r.id as string,
    conversationId: r.conversation_id as string,
    role: r.role as string,
    content: r.content as string,
    intent: r.intent as string | null,
    confidence: r.confidence as number | null,
    source: r.source as string | null,
    actionId: r.action_id as string | null,
    articleId: r.article_id as string | null,
    feedbackHelpful: r.feedback_helpful as boolean | null,
    feedbackReason: r.feedback_reason as string | null,
    feedbackCorrection: r.feedback_correction as string | null,
    createdAt: new Date(r.created_at as string).toISOString(),
  }));
}

export async function renameConversation(conversationId: string, title: string): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const companyId = session.company.id;
  const userId = session.userId;

  await sql`
    UPDATE assistant_conversations
    SET title = ${title}, updated_at = now()
    WHERE id = ${conversationId} AND company_id = ${companyId} AND user_id = ${userId}
  `;
  return { ok: true };
}

export async function deleteConversation(conversationId: string): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const companyId = session.company.id;
  const userId = session.userId;

  // Soft delete
  await sql`
    UPDATE assistant_conversations
    SET status = 'deleted', deleted_at = now(), updated_at = now()
    WHERE id = ${conversationId} AND company_id = ${companyId} AND user_id = ${userId}
  `;
  // Delete embeddings
  await sql`DELETE FROM assistant_query_embeddings WHERE conversation_id = ${conversationId}`;
  return { ok: true };
}

export async function searchConversations(query: string): Promise<AssistantConversation[]> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const companyId = session.company.id;
  const userId = session.userId;
  const q = `%${normalizeText(query)}%`;

  const rows = await sql`
    SELECT id, title, summary, last_intent, status, context_route, created_at, updated_at
    FROM assistant_conversations
    WHERE company_id = ${companyId} AND user_id = ${userId} AND status != 'deleted'
      AND (LOWER(title) LIKE ${q} OR LOWER(COALESCE(summary, '')) LIKE ${q})
    ORDER BY updated_at DESC
    LIMIT 20
  `;
  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    summary: r.summary as string | null,
    lastIntent: r.last_intent as string | null,
    status: r.status as string,
    contextRoute: r.context_route as string | null,
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  }));
}

/* ----------------------------- Message persistence ----------------------------- */

export async function saveMessage(
  conversationId: string,
  role: string,
  content: string,
  metadata?: {
    intent?: string | null;
    confidence?: number | null;
    source?: string | null;
    actionId?: string | null;
    articleId?: string | null;
  }
): Promise<string> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const companyId = session.company.id;
  const userId = session.userId;

  // Verify ownership
  const conv = await sql`
    SELECT id FROM assistant_conversations
    WHERE id = ${conversationId} AND company_id = ${companyId} AND user_id = ${userId}
  `;
  if (conv.length === 0) throw new Error("NOT_FOUND");

  const rows = await sql`
    INSERT INTO assistant_messages (conversation_id, role, content, intent, confidence, source, action_id, article_id)
    VALUES (${conversationId}, ${role}, ${content},
      ${metadata?.intent ?? null}, ${metadata?.confidence ?? null},
      ${metadata?.source ?? null}, ${metadata?.actionId ?? null}, ${metadata?.articleId ?? null})
    RETURNING id
  `;

  // Update conversation timestamp and auto-title from first user message
  if (role === "user") {
    const existing = await sql`
      SELECT title FROM assistant_conversations WHERE id = ${conversationId}
    `;
    if (existing.length > 0 && (existing[0].title as string) === "Nieuw gesprek") {
      const title = content.slice(0, 50) + (content.length > 50 ? "…" : "");
      await sql`UPDATE assistant_conversations SET title = ${title}, updated_at = now() WHERE id = ${conversationId}`;
    } else {
      await sql`UPDATE assistant_conversations SET updated_at = now() WHERE id = ${conversationId}`;
    }
  } else {
    await sql`UPDATE assistant_conversations SET updated_at = now() WHERE id = ${conversationId}`;
  }

  return rows[0].id as string;
}

export async function updateMessageFeedback(
  messageId: string,
  helpful: boolean,
  reason?: string,
  correction?: string
): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const companyId = session.company.id;
  const userId = session.userId;

  // Get message details for feedback record
  const msgRows = await sql`
    SELECT m.id, m.conversation_id, m.content, m.intent, m.source, m.article_id,
           c.context_route
    FROM assistant_messages m
    JOIN assistant_conversations c ON m.conversation_id = c.id
    WHERE m.id = ${messageId} AND c.company_id = ${companyId} AND c.user_id = ${userId}
  `;
  if (msgRows.length === 0) throw new Error("NOT_FOUND");
  const msg = msgRows[0];

  // Find the original user query (previous user message in same conversation)
  const userQueryRows = await sql`
    SELECT content FROM assistant_messages
    WHERE conversation_id = ${msg.conversation_id as string} AND role = 'user'
      AND created_at < (SELECT created_at FROM assistant_messages WHERE id = ${messageId})
    ORDER BY created_at DESC LIMIT 1
  `;
  const originalQuery = userQueryRows.length > 0 ? (userQueryRows[0].content as string) : "";

  // Update message
  await sql`
    UPDATE assistant_messages
    SET feedback_helpful = ${helpful}, feedback_reason = ${reason ?? null}, feedback_correction = ${correction ?? null}
    WHERE id = ${messageId}
  `;

  // Insert feedback record
  await sql`
    INSERT INTO assistant_feedback (message_id, conversation_id, company_id, user_id, helpful, reason, correction,
      original_query, original_answer, intent, source, context_route)
    VALUES (${messageId}, ${msg.conversation_id as string}, ${companyId}, ${userId}, ${helpful},
      ${reason ?? null}, ${correction ?? null}, ${originalQuery}, ${msg.content as string},
      ${msg.intent as string | null}, ${msg.source as string | null}, ${msg.context_route as string | null})
  `;

  // If negative feedback, add to improvement queue
  if (!helpful) {
    const cluster = normalizeText(originalQuery).split(/\s+/).slice(0, 3).join(" ");
    const existingQueue = await sql`
      SELECT id, negative_feedback_count FROM assistant_improvement_queue
      WHERE question_cluster = ${cluster} AND status = 'open'
    `;
    if (existingQueue.length > 0) {
      await sql`
        UPDATE assistant_improvement_queue
        SET negative_feedback_count = negative_feedback_count + 1, updated_at = now()
        WHERE id = ${existingQueue[0].id as string}
      `;
    } else {
      await sql`
        INSERT INTO assistant_improvement_queue (question_cluster, example_questions, current_answer, current_article_id, failure_reason, negative_feedback_count)
        VALUES (${cluster}, ARRAY[${originalQuery}], ${msg.content as string}, ${msg.article_id as string | null}, 'negative_feedback', 1)
      `;
    }
  }

  return { ok: true };
}

/* ----------------------------- Conversation summary ----------------------------- */

export async function updateConversationSummary(conversationId: string): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const companyId = session.company.id;

  // Verify ownership
  const conv = await sql`
    SELECT id FROM assistant_conversations
    WHERE id = ${conversationId} AND company_id = ${companyId}
  `;
  if (conv.length === 0) throw new Error("NOT_FOUND");

  // Get all messages
  const messages = await sql`
    SELECT role, content, intent FROM assistant_messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
  `;

  if (messages.length < 4) return { ok: true }; // Only summarize longer conversations

  // Build a simple summary from user messages and intents
  const userMessages = messages.filter((m) => m.role === "user").map((m) => m.content as string);
  const intents = messages.filter((m) => m.intent !== null).map((m) => m.intent as string);
  const lastIntent = intents[intents.length - 1] ?? null;

  const summaryParts: string[] = [];
  if (userMessages.length > 0) {
    summaryParts.push(`Vraag: ${userMessages[0].slice(0, 80)}`);
  }
  if (lastIntent) {
    summaryParts.push(`Intentie: ${lastIntent}`);
  }
  if (userMessages.length > 1) {
    const lastUserMsg = userMessages[userMessages.length - 1];
    if (isCorrection(lastUserMsg)) {
      summaryParts.push(`Correctie: ${lastUserMsg.slice(0, 80)}`);
    }
  }
  const summary = summaryParts.join(" | ");

  await sql`
    UPDATE assistant_conversations
    SET summary = ${summary}, last_intent = ${lastIntent}, updated_at = now()
    WHERE id = ${conversationId}
  `;

  return { ok: true };
}

/* ----------------------------- Memory management ----------------------------- */

export async function listMemories(): Promise<AssistantMemory[]> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const companyId = session.company.id;
  const userId = session.userId;

  const rows = await sql`
    SELECT id, memory_key, memory_value, user_confirmed, created_at
    FROM assistant_memories
    WHERE company_id = ${companyId} AND user_id = ${userId} AND deleted_at IS NULL
    ORDER BY created_at DESC
  `;
  return rows.map((r) => ({
    id: r.id as string,
    memoryKey: r.memory_key as string,
    memoryValue: r.memory_value as string,
    userConfirmed: r.user_confirmed as boolean,
    createdAt: new Date(r.created_at as string).toISOString(),
  }));
}

export async function addMemory(key: string, value: string): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const companyId = session.company.id;
  const userId = session.userId;

  await sql`
    INSERT INTO assistant_memories (company_id, user_id, memory_key, memory_value, user_confirmed)
    VALUES (${companyId}, ${userId}, ${key}, ${value}, true)
    ON CONFLICT DO NOTHING
  `;
  return { ok: true };
}

export async function deleteMemory(memoryId: string): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const companyId = session.company.id;
  const userId = session.userId;

  await sql`
    UPDATE assistant_memories SET deleted_at = now()
    WHERE id = ${memoryId} AND company_id = ${companyId} AND user_id = ${userId}
  `;
  return { ok: true };
}

export async function clearAllMemories(): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const companyId = session.company.id;
  const userId = session.userId;

  await sql`
    UPDATE assistant_memories SET deleted_at = now()
    WHERE company_id = ${companyId} AND user_id = ${userId} AND deleted_at IS NULL
  `;
  return { ok: true };
}

/* ----------------------------- Data export & wipe ----------------------------- */

export async function exportAssistantData(): Promise<{
  conversations: AssistantConversation[];
  messages: AssistantMessageDB[];
  memories: AssistantMemory[];
}> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const companyId = session.company.id;
  const userId = session.userId;

  const conversations = await listConversations();
  const convIds = conversations.map((c) => c.id);
  let messages: AssistantMessageDB[] = [];
  if (convIds.length > 0) {
    const msgRows = await sql`
      SELECT m.id, m.conversation_id, m.role, m.content, m.intent, m.confidence, m.source,
             m.action_id, m.article_id, m.feedback_helpful, m.feedback_reason, m.feedback_correction, m.created_at
      FROM assistant_messages m
      WHERE m.conversation_id = ANY(${convIds})
      ORDER BY m.created_at ASC
    `;
    messages = msgRows.map((r) => ({
      id: r.id as string,
      conversationId: r.conversation_id as string,
      role: r.role as string,
      content: r.content as string,
      intent: r.intent as string | null,
      confidence: r.confidence as number | null,
      source: r.source as string | null,
      actionId: r.action_id as string | null,
      articleId: r.article_id as string | null,
      feedbackHelpful: r.feedback_helpful as boolean | null,
      feedbackReason: r.feedback_reason as string | null,
      feedbackCorrection: r.feedback_correction as string | null,
      createdAt: new Date(r.created_at as string).toISOString(),
    }));
  }
  const memories = await listMemories();
  return { conversations, messages, memories };
}

export async function wipeAllAssistantData(): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const companyId = session.company.id;
  const userId = session.userId;

  // Hard delete all conversations and related data (cascades to messages, feedback, embeddings)
  await sql`
    DELETE FROM assistant_conversations
    WHERE company_id = ${companyId} AND user_id = ${userId}
  `;
  // Hard delete memories
  await sql`
    DELETE FROM assistant_memories
    WHERE company_id = ${companyId} AND user_id = ${userId}
  `;
  return { ok: true };
}

/* ----------------------------- Enhanced query processing ----------------------------- */

export async function processAssistantQueryV2(
  query: string,
  contextRoute: string | undefined,
  conversationHistory: ConversationTurn[],
  conversationId: string | null
): Promise<{
  answer: string;
  articleId: string | null;
  steps?: string[];
  actions?: string[];
  tourId?: string;
  found: boolean;
  clarificationOptions?: { label: string; query: string }[];
  intent: string | null;
  confidence: number;
  source: string;
}> {
  // 1. Classify intent with conversation context
  const intentMatch = classifyIntent(query, contextRoute, conversationHistory);

  // 2. If needs clarification
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
      intent: intentMatch.intent,
      confidence: intentMatch.confidence,
      source: "fallback",
    };
  }

  // 3. Find penalized articles from corrections
  const penalizeArticleIds: string[] = [];
  if (intentMatch.isCorrection && conversationHistory.length > 0) {
    const lastAssistant = [...conversationHistory].reverse().find((m) => m.role === "assistant");
    if (lastAssistant) {
      const lastAnswerNorm = normalizeText(lastAssistant.text);
      for (const article of searchKnowledgeBaseWithIntent(lastAssistant.text)) {
        if (normalizeText(article.answer) === lastAnswerNorm) {
          penalizeArticleIds.push(article.id);
          break;
        }
      }
    }
  }

  // 4. Search knowledge base
  const results = searchKnowledgeBaseWithIntent(query, intentMatch.articleId, penalizeArticleIds);

  // 5. Inject intent article if clear
  if (intentMatch.articleId && intentMatch.confidence > 0.4) {
    const inResults = results.find((r) => r.id === intentMatch.articleId);
    if (!inResults) {
      const article = getArticleById(intentMatch.articleId);
      if (article) results.unshift(article);
    }
  }

  const top = results[0];

  // 6. Log
  try {
    await logHelpQuery(query, top?.id ?? null, contextRoute);
  } catch {}

  // 7. No result
  if (!top) {
    return {
      answer: "Ik kon hier nog geen betrouwbare uitleg voor vinden. Probeer je vraag anders te formuleren of bekijk het Helpcentrum.",
      articleId: null,
      found: false,
      actions: ["OPEN_HELP_CENTER"],
      intent: intentMatch.intent,
      confidence: intentMatch.confidence,
      source: "fallback",
    };
  }

  // 8. Build answer
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
    intent: intentMatch.intent,
    confidence: intentMatch.confidence,
    source: "knowledge_base",
  };
}
