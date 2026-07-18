import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getConversations } from "@/lib/queries";
import { sql } from "@/lib/db";
import { getChatMuteStatus, isContactBlocked } from "@/lib/actions";
import { ConversationClient } from "./ConversationClient";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/auth");

  const conversations = await getConversations(session.company.id);
  const conversation = conversations.find((c) => c.id === id);
  if (!conversation) return notFound();

  let needBody: string | undefined;
  let needType: string | undefined;
  if (conversation.needId) {
    const rows = await sql`SELECT body, type FROM needs WHERE id = ${conversation.needId}`;
    if (rows.length > 0) {
      needBody = rows[0].body as string;
      needType = rows[0].type as string;
    }
  }

  const [muteStatus, blocked] = await Promise.all([
    getChatMuteStatus(id),
    isContactBlocked(conversation.companyId),
  ]);

  return (
    <ConversationClient
      conversation={conversation}
      needBody={needBody}
      needType={needType}
      initialMuted={muteStatus.muted}
      initialMuteIndefinite={muteStatus.indefinite}
      initialMutedUntil={muteStatus.mutedUntil ?? undefined}
      initialBlocked={blocked}
    />
  );
}
