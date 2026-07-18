import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";

const PAGE_SIZE = 50;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });

  const member = await sql`SELECT 1 FROM conversation_participants
    WHERE conversation_id = ${id} AND company_id = ${session.company.id}`;
  if (member.length === 0) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const before = searchParams.get("before");

  const rows = before
    ? await sql`
        SELECT * FROM messages
        WHERE conversation_id = ${id} AND created_at < (
          SELECT created_at FROM messages WHERE id = ${before}
        )
        ORDER BY created_at DESC
        LIMIT ${PAGE_SIZE}
      `
    : await sql`
        SELECT * FROM messages
        WHERE conversation_id = ${id}
        ORDER BY created_at DESC
        LIMIT ${PAGE_SIZE}
      `;

  const ordered = [...rows].reverse();

  const messages = ordered.map((m) => ({
    id: m.id as string,
    fromMe: (m.sender_company_id as string) === session.company.id,
    kind: m.kind as string,
    body: m.body as string,
    meta: (m.meta as string) ?? undefined,
    time: new Date(m.created_at as string).toISOString(),
    status: (m.status as string) || "sent",
    readAt: m.read_at ? new Date(m.read_at as string).toISOString() : undefined,
    editedAt: m.edited_at ? new Date(m.edited_at as string).toISOString() : undefined,
    deleted: (m.deleted as boolean) ?? false,
    replyToId: (m.reply_to_id as string) ?? undefined,
  }));

  return NextResponse.json({ messages, hasMore: rows.length === PAGE_SIZE });
}
