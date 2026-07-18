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
  Sprout,
  Hammer,
  Leaf,
  Banknote,
  Warehouse,
  UtensilsCrossed,
  ArrowLeftRight,
  Factory,
  ShoppingBag,
  Monitor,
  Truck,
  Building,
  Package,
  HeartPulse,
  Globe,
} from "lucide-react";
import { useApp } from "@/components/app-store";
import { useHelp } from "@/components/help/help-provider";
import { PersonalRecommendation } from "@/components/help/personal-recommendation";
import { OnboardingChecklist } from "@/components/help/onboarding-checklist";
import { PostCard } from "@/components/need-card";
import { CompanyAvatar, Pill } from "@/components/ui/primitives";
import { FeedRightColumn } from "@/components/feed-right-column";
import { VyntaPromoCarousel } from "@/components/vynta-promo-carousel";
import { networkIcon } from "@/lib/network-icon";
import { POST_TYPES, POST_TYPE_ORDER } from "@/lib/need-types";
import type { Post, PostType } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  const { me, myNetworks, companyById, setCreateOpen } = useApp();
  const [filter, setFilter] = useState<PostType | "all">("all");

  const myNetworkIds = myNetworks.map((n) => n.id);
  const followedIds = new Set<string>();

  const relevanceScore = (post: Post, c: ReturnType<typeof companyById>) => {
    let score = 0;
    if (post.companyId === me.id) score += 100;
    if (followedIds.has(post.companyId)) score += 80;
    if (c?.city && me.city && c.city.toLowerCase() === me.city.toLowerCase()) score += 60;
    if (c?.province && me.province && c.province.toLowerCase() === me.province.toLowerCase()) score += 40;
    if (c?.industry && me.industry && c.industry.toLowerCase() === me.industry.toLowerCase()) score += 30;
    if (c?.country && me.country && c.country.toLowerCase() === me.country.toLowerCase()) score += 20;
    score += Math.min(post.reactions, 50) * 0.5;
    return score;
  };

  const filtered = useMemo(() => {
    let list = posts;
    list = list.filter(
      (n) => n.companyId === me.id || n.networks.some((id) => myNetworkIds.includes(id))
    );
    if (filter !== "all") list = list.filter((n) => n.type === filter);
    return [...list].sort(
      (a, b) =>
        relevanceScore(b, companyById(b.companyId)) - relevanceScore(a, companyById(a.companyId))
    );
  }, [posts, filter, me, myNetworkIds, companyById]);

  return (
    <div className="mx-auto flex w-full max-w-[1320px] px-4 pb-32 pt-5 lg:pt-8">
      {/* Main feed */}
      <div className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[800px]">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[28px] font-bold tracking-tight">
              {greeting()}, {me.name}
            </h1>
            <p className="mt-0.5 text-[17px] text-muted">Dit gebeurt vandaag in jouw netwerk.</p>
          </div>

          {/* Personal recommendation */}
          <PersonalRecommendation />

          {/* Network stories */}
          {myNetworks.length > 0 && (
            <div className="no-scrollbar -mx-4 mb-6 flex gap-3 overflow-x-auto px-4 pb-2">
              <button
                onClick={() => setCreateOpen(true)}
                className="flex shrink-0 flex-col items-center gap-2"
              >
                <span className="grid h-[80px] w-[80px] place-items-center rounded-full border-2 border-dashed border-border bg-surface text-muted transition-colors hover:border-border-strong hover:text-foreground">
                  <span className="text-3xl">+</span>
                </span>
                <span className="max-w-[80px] truncate text-xs font-medium">Plaatsen</span>
              </button>
              {myNetworks.slice(0, 6).map((n) => {
                const Icon = networkIcon(n.name, n.type);
                return (
                  <Link
                    key={n.id}
                    href={`/networks/${n.id}`}
                    className="group flex shrink-0 flex-col items-center gap-2"
                  >
                    <span className="grid h-[80px] w-[80px] place-items-center rounded-full bg-surface-2 text-muted ring-1 ring-border transition-all hover:scale-105 hover:bg-border hover:ring-brand/30">
                      <Icon size={28} strokeWidth={1.5} className="transition-colors group-hover:text-brand" />
                    </span>
                    <span className="max-w-[80px] truncate text-xs font-medium text-muted transition-colors group-hover:text-foreground">{n.name}</span>
                  </Link>
                );
              })}
              {myNetworks.length > 6 && (
                <Link
                  href="/networks"
                  className="group flex shrink-0 flex-col items-center gap-2"
                >
                  <span className="grid h-[80px] w-[80px] place-items-center rounded-full bg-surface-2 text-muted ring-1 ring-border transition-all hover:scale-105 hover:bg-border hover:ring-brand/30">
                    <span className="text-sm font-semibold">+{myNetworks.length - 6}</span>
                  </span>
                  <span className="max-w-[80px] truncate text-xs font-medium text-muted transition-colors group-hover:text-foreground">Meer netwerken</span>
                </Link>
              )}
            </div>
          )}

          {/* Composer */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
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
              <span className="text-[17px] text-muted">Deel iets met je netwerk…</span>
            </button>
            <div className="no-scrollbar flex items-center gap-1 border-t border-border px-2 py-2">
              {COMPOSER_ACTIONS.map((action) => (
                <button
                  key={action.key}
                  onClick={() => setCreateOpen(true)}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
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
                  {i === 2 && (
                    <div className="2xl:hidden">
                      <VyntaPromoCarousel variant="inline" />
                    </div>
                  )}
                </motion.article>
              ))
            )}
          </div>

          <div className="mt-6 2xl:hidden">
            <VyntaPromoCarousel variant="inline" />
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
