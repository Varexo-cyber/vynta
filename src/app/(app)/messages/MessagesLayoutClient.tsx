"use client";

import { usePathname } from "next/navigation";
import { ConversationList } from "@/components/conversation-list";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/types";

export function MessagesLayoutClient({
  conversations,
  children,
}: {
  conversations: Conversation[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const inConversation = pathname !== "/messages";

  return (
    <div className="fixed inset-x-0 bottom-16 top-14 z-10 flex bg-background lg:bottom-0 lg:left-[260px] lg:top-0">
      <div
        className={cn(
          "w-full shrink-0 overflow-y-auto border-r border-border bg-surface lg:block lg:w-[360px]",
          inConversation && "hidden"
        )}
      >
        <ConversationList conversations={conversations} />
      </div>
      <div className={cn("min-w-0 flex-1 bg-background", !inConversation && "hidden lg:block")}>
        {children}
      </div>
    </div>
  );
}
