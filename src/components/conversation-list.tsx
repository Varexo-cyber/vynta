"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useApp } from "./app-store";
import { CompanyAvatar, VerifiedBadge } from "./ui/primitives";
import { cn, timeAgo } from "@/lib/utils";
import type { Conversation } from "@/lib/types";

export function ConversationList({ conversations }: { conversations: Conversation[] }) {
  const { companyById } = useApp();
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="messages-list-heading flex items-center justify-between gap-3 px-5 py-5">
        <h1 className="text-2xl font-bold tracking-tight">Berichten</h1>
        <Link
          href="/search?intent=message"
          data-tour-id="new-conversation"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold transition-colors hover:bg-surface-2"
        >
          <Plus size={15} /> Nieuw
        </Link>
      </div>
      <Link
        href="/search?intent=message"
        data-tour-id="new-conversation"
        className="mx-4 mt-3 flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-2 lg:hidden"
      >
        <Plus size={16} aria-hidden="true" /> Nieuw gesprek
      </Link>
      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
        {conversations.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted">Nog geen gesprekken.</p>
        )}
        {conversations.map((c) => {
          const company = companyById(c.companyId);
          const last = c.messages[c.messages.length - 1];
          if (!company) return null;
          const active = pathname === `/messages/${c.id}`;
          const preview =
            !last
              ? "Nieuw gesprek"
              : last.kind === "text"
              ? last.body
              : last.kind === "document"
              ? "Document"
              : last.kind === "image"
              ? "Afbeelding"
              : last.kind === "video"
              ? "Video"
              : last.kind === "voice"
              ? "Spraakbericht"
              : last.kind === "card"
              ? "Visitekaartje"
              : last.kind === "location"
              ? "Locatie"
              : last.body;
          return (
            <Link
              key={c.id}
              href={`/messages/${c.id}`}
              className={cn(
                "relative flex items-center gap-3.5 rounded-2xl px-3 py-3 transition-all hover:bg-surface-2",
                active && "bg-surface-2"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-foreground" />
              )}
              <CompanyAvatar name={company.name} color={company.logoColor} size={52} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-semibold">{company.name}</span>
                  {company.verified && <VerifiedBadge size={14} />}
                  <span className="ml-auto shrink-0 text-xs text-muted">
                    {last ? timeAgo(last.time) : ""}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className={cn("truncate text-sm", c.unread ? "font-semibold text-foreground" : "text-muted")}>
                    {last?.fromMe && "Jij: "}
                    {preview}
                  </p>
                  {c.unread > 0 && (
                    <span className="ml-auto grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-brand-fg">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
