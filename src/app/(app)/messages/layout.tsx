import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getConversations } from "@/lib/queries";
import { ConversationList } from "@/components/conversation-list";
import { MessagesLayoutClient } from "./MessagesLayoutClient";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth");
  const conversations = await getConversations(session.company.id);

  return (
    <MessagesLayoutClient conversations={conversations}>
      {children}
    </MessagesLayoutClient>
  );
}
