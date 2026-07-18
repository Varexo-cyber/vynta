"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Sparkles,
  UserPlus,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useApp } from "@/components/app-store";
import { markAllNotificationsRead } from "@/lib/actions";
import { CompanyAvatar } from "@/components/ui/primitives";
import { cn, timeAgo } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/lib/types";

const ICONS: Record<NotificationType, { icon: typeof MessageCircle; color: string }> = {
  response: { icon: MessageCircle, color: "var(--type-sourcing)" },
  match: { icon: Sparkles, color: "var(--brand)" },
  follow: { icon: UserPlus, color: "var(--type-hiring)" },
  network: { icon: TrendingUp, color: "var(--type-selling)" },
  expiry: { icon: Clock, color: "var(--type-partnership)" },
};

const TABS = ["all", "responses", "networks"] as const;

export function NotificationsClient({ notifications }: { notifications: AppNotification[] }) {
  const { companyById } = useApp();
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");

  const filtered = notifications.filter((n) => {
    if (tab === "all") return true;
    if (tab === "responses") return n.type === "response" || n.type === "match";
    return n.type === "network" || n.type === "follow";
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-32 pt-5 lg:pt-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Meldingen</h1>
        <button
          onClick={() => markAllNotificationsRead()}
          className="text-sm font-semibold text-muted hover:text-foreground press"
        >
          Alles gelezen
        </button>
      </div>

      <div className="mt-6 flex gap-1 rounded-full bg-surface-2/70 p-1 sm:max-w-xs">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-full py-2 text-sm font-semibold transition-all press",
              tab === t ? "bg-foreground text-background" : "text-muted hover:text-foreground"
            )}
          >
            {t === "all" ? "Alles" : t === "responses" ? "Reacties" : "Netwerken"}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col">
        {filtered.map((n, i) => {
          const meta = ICONS[n.type];
          const Icon = meta.icon;
          const company = n.companyId ? companyById(n.companyId) : undefined;
          const href = n.needId ? (n.id.startsWith("opp-") ? `/opportunities/${n.needId}` : `/feed`) : company ? `/company/${company.id}` : "/feed";
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.2) }}
              className="border-t border-border first:border-t-0"
            >
              <Link
                href={href}
                className={cn(
                  "flex items-start gap-4 py-4 transition-colors hover:bg-surface-2/50",
                  !n.read && "bg-surface-2/20"
                )}
              >
                <div className="relative shrink-0">
                  {company ? (
                    <CompanyAvatar name={company.name} color={company.logoColor} size={48} />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-2">
                      <Icon size={20} style={{ color: meta.color }} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-snug">
                    <span className="font-semibold">{n.title}</span>{" "}
                    <span className="text-muted">{n.body}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted">{timeAgo(n.time)}</p>
                </div>
                {!n.read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
