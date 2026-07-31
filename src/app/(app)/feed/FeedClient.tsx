"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Image as ImageIcon,
  Video,
  HelpCircle,
  Tag,
  Briefcase,
} from "lucide-react";
import { useApp } from "@/components/app-store";
import { PersonalRecommendation } from "@/components/help/personal-recommendation";
import { OnboardingChecklist } from "@/components/help/onboarding-checklist";
import { PostCard } from "@/components/need-card";
import { CompanyAvatar, Pill } from "@/components/ui/primitives";
import { FeedRightColumn } from "@/components/feed-right-column";
import { networkIcon } from "@/lib/network-icon";
import { POST_TYPES, POST_TYPE_ORDER } from "@/lib/need-types";
import type { Post, PostType } from "@/lib/types";

const COMPOSER_ACTIONS = [
  { key: "photo", label: "Foto", icon: ImageIcon, type: "update" as PostType },
  { key: "video", label: "Video", icon: Video, type: "update" as PostType },
  { key: "question", label: "Vraag", icon: HelpCircle, type: "question" as PostType },
  { key: "offer", label: "Aanbod", icon: Tag, type: "offer" as PostType },
  { key: "job", label: "Vacature", icon: Briefcase, type: "hiring" as PostType },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goedemiddag";
  return "Goedenavond";
}

export function FeedClient({ posts }: { posts: Post[] }) {
  const { me, myNetworks, companyById, followingIds, setCreateOpen } = useApp();
  const [filter, setFilter] = useState<PostType | "all">("all");

  const myNetworkIds = useMemo(() => myNetworks.map((network) => network.id), [myNetworks]);

  const filtered = useMemo(() => {
    const relevanceScore = (post: Post) => {
      const company = companyById(post.companyId);
      let score = 0;
      if (post.companyId === me.id) score += 100;
      if (followingIds.has(post.companyId)) score += 80;
      if (company?.city && me.city && company.city.toLowerCase() === me.city.toLowerCase()) score += 60;
      if (company?.province && me.province && company.province.toLowerCase() === me.province.toLowerCase()) score += 40;
      if (company?.industry && me.industry && company.industry.toLowerCase() === me.industry.toLowerCase()) score += 30;
      if (company?.country && me.country && company.country.toLowerCase() === me.country.toLowerCase()) score += 20;
      return score + Math.min(post.reactions, 50) * 0.5;
    };
    let list = posts;
    list = list.filter(
      (n) => n.companyId === me.id || n.networks.some((id) => myNetworkIds.includes(id))
    );
    if (filter !== "all") list = list.filter((n) => n.type === filter);
    return [...list].sort(
      (a, b) =>
        relevanceScore(b) - relevanceScore(a)
    );
  }, [posts, filter, me, myNetworkIds, companyById, followingIds]);

  return (
    <div className="feed-page mx-auto flex w-full max-w-[1320px] gap-8 px-4 pb-32 pt-5 lg:px-8 lg:pt-8">
      {/* Main feed */}
      <div className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[800px]">
          {/* Header */}
          <div className="feed-page-heading mb-7 border-b border-border-strong pb-5">
            <p className="vynta-kicker">Jouw werkdag</p>
            <h1 className="mt-3 text-[32px] font-bold tracking-[-0.045em]">
              {greeting()}, {me.name}
            </h1>
            <p className="mt-1 text-[16px] text-muted">Vragen, updates en kansen uit je zakelijke netwerk.</p>
          </div>

          {/* Personal recommendation */}
          <PersonalRecommendation />

          <div className="mb-6 2xl:hidden">
            <OnboardingChecklist compact />
          </div>

          {/* Network stories */}
          {myNetworks.length > 0 && (
            <div className="network-story-strip no-scrollbar -mx-4 mb-7 flex gap-2 overflow-x-auto px-4 pb-2">
              <button
                onClick={() => setCreateOpen(true)}
                className="group flex min-w-[132px] shrink-0 items-center gap-3 rounded-md border border-dashed border-border-strong bg-transparent px-3 py-3 text-left"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-foreground text-background transition-colors group-hover:bg-brand group-hover:text-white">
                  <span className="text-xl">+</span>
                </span>
                <span><strong className="block text-xs">Nieuw bericht</strong><small className="mt-0.5 block text-[10px] text-muted">Deel een signaal</small></span>
              </button>
              {myNetworks.slice(0, 6).map((n) => {
                const Icon = networkIcon(n.name, n.type);
                return (
                  <Link
                    key={n.id}
                    href={`/networks/${n.id}`}
                    className="group flex min-w-[152px] shrink-0 items-center gap-3 rounded-md border border-border bg-surface px-3 py-3 text-left transition-colors hover:border-border-strong"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-surface-2 text-muted transition-colors group-hover:bg-foreground group-hover:text-background">
                      <Icon size={19} strokeWidth={1.7} />
                    </span>
                    <span className="min-w-0"><strong className="block truncate text-xs">{n.name}</strong><small className="mt-0.5 block text-[10px] uppercase tracking-wide text-subtle">Netwerk</small></span>
                  </Link>
                );
              })}
              {myNetworks.length > 6 && (
                <Link
                  href="/networks"
                  className="group flex min-w-[128px] shrink-0 items-center gap-3 rounded-md border border-border bg-surface px-3 py-3"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-surface-2 text-muted transition-colors group-hover:bg-foreground group-hover:text-background">
                    <span className="text-sm font-semibold">+{myNetworks.length - 6}</span>
                  </span>
                  <span className="text-xs font-semibold">Alle netwerken</span>
                </Link>
              )}
            </div>
          )}

          {/* Composer */}
          <div className="feed-composer mb-7 overflow-hidden border border-border bg-surface">
            <button
              onClick={() => setCreateOpen(true)}
              className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-2"
            >
              <CompanyAvatar
                name={me.name}
                color={me.logoColor}
                logoUrl={me.logoUrl}
                website={me.website}
                size={48}
              />
              <span className="text-[16px] text-muted">Wat moet jouw netwerk vandaag weten?</span>
            </button>
            <div className="no-scrollbar flex items-center gap-1 overflow-x-auto border-t border-border px-2 py-2">
              {COMPOSER_ACTIONS.map((action) => (
                <button
                  key={action.key}
                  onClick={() => setCreateOpen(true)}
                  className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-sm px-3.5 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-foreground sm:px-4"
                >
                  <action.icon size={18} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scope filters */}
          {/* Type filters */}
          <div className="no-scrollbar mb-2 flex items-center gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">Type</span>
            <Pill className="shrink-0" active={filter === "all"} onClick={() => setFilter("all")}>
              Alles
            </Pill>
            {POST_TYPE_ORDER.map((t) => {
              const meta = POST_TYPES[t];
              const Icon = meta.icon;
              return (
                <Pill className="shrink-0" key={t} active={filter === t} onClick={() => setFilter(t)}>
                  <Icon size={14} className={filter === t ? undefined : "text-muted"} strokeWidth={1.8} />
                  {meta.label}
                </Pill>
              );
            })}
          </div>

          {/* Feed */}
          <div className="flex flex-col">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-lg font-semibold">Nog niets hier</p>
                <p className="mt-1 text-sm text-muted">
                  Plaats de eerste post of switch naar Heel Nederland.
                </p>
              </div>
            ) : (
              filtered.map((post, i) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.25), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="border-t border-border first:border-t-0"
                >
                  <PostCard post={post} index={i} />
                </motion.article>
              ))
            )}
          </div>

          <p className="mt-12 text-center text-xs text-subtle">
            Vynta — © {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Right column */}
      <aside className="hidden 2xl:block w-[360px] shrink-0">
        <div className="sticky top-24 space-y-4">
          <OnboardingChecklist />
          <FeedRightColumn />
        </div>
      </aside>
    </div>
  );
}
