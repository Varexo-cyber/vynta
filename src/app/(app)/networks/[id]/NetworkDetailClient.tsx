"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Briefcase, MapPin, Map, Globe } from "lucide-react";
import { PostCard } from "@/components/need-card";
import { toggleNetworkFollow } from "@/lib/actions";
import { NetworkIcon } from "@/components/network-icon";
import { formatNumber, cn } from "@/lib/utils";
import type { Network, Post } from "@/lib/types";

const TYPE_LABELS: Record<Network["type"], string> = {
  municipality: "Gemeente",
  province: "Provincie",
  industry: "Branche",
  national: "Landelijk netwerk",
};

const TYPE_ICON: Record<Network["type"], typeof MapPin> = {
  municipality: MapPin,
  province: Map,
  industry: Briefcase,
  national: Globe,
};

export function NetworkDetailClient({
  network,
  posts,
  connected,
  followedInitial,
}: {
  network: Network;
  posts: Post[];
  connected: boolean;
  followedInitial: boolean;
}) {
  const [followed, setFollowed] = useState(followedInitial);
  const [tab, setTab] = useState<"feed" | "about">("feed");

  const onFollowToggle = () => {
    setFollowed((v) => !v);
    void toggleNetworkFollow(network.id);
  };

  const TypeIcon = TYPE_ICON[network.type];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-32 pt-5 lg:pt-10">
      <Link href="/networks" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground press">
        <ArrowLeft size={16} /> Terug
      </Link>

      <div className="rounded-3xl border border-border bg-surface p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-surface-2 text-muted shadow-inner">
            <NetworkIcon kind={network.type} size={32} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted">
                <TypeIcon size={12} />
                {TYPE_LABELS[network.type]}
              </span>
              {connected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                  <Check size={12} /> Verbonden
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">{network.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {network.members > 0 ? `${formatNumber(network.members)} aangesloten bedrijven` : "Nog geen bedrijven"}
              {network.members > 0 && network.activeToday > 0 ? " · " : null}
              {network.activeToday > 0 ? `${formatNumber(network.activeToday)} actief vandaag` : null}
            </p>
          </div>
          {!connected && (
            <button
              onClick={onFollowToggle}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-all press",
                followed
                  ? "border border-border bg-transparent text-foreground hover:bg-surface-2"
                  : "bg-foreground text-background hover:opacity-90"
              )}
            >
              {followed ? <><Check size={15} /> Gevolgd</> : "Volgen"}
            </button>
          )}
        </div>
        <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-foreground/85">
          {network.description}
        </p>

        {followed && !connected && (
          <p className="mt-4 text-sm text-muted">
            Berichten uit dit netwerk verschijnen vaker in je feed.
          </p>
        )}
      </div>

      <div className="mt-6 flex gap-1 rounded-full bg-surface-2/70 p-1 sm:max-w-xs">
        {(["feed", "about"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-full py-2 text-sm font-semibold transition-all press",
              tab === t ? "bg-foreground text-background" : "text-muted hover:text-foreground"
            )}
          >
            {t === "feed" ? "Feed" : "Over"}
          </button>
        ))}
      </div>

      {tab === "feed" ? (
        <div className="mt-6 flex flex-col">
          <div className="mx-auto w-full max-w-[800px]">
            {posts.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted">
                Nog geen posts hier. Wees de eerste die plaatst.
              </div>
            ) : (
              posts.map((post, i) => (
                <div key={post.id} className="border-t border-border first:border-t-0">
                  <PostCard post={post} index={i} />
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 max-w-2xl rounded-2xl border border-border bg-surface p-6 text-[16px] leading-relaxed text-foreground/85">
          <p className="mb-2 font-semibold text-foreground">Over dit netwerk</p>
          {network.description} Dit is de plek voor bedrijven om posts te plaatsen
          en te ontdekken die relevant zijn voor {network.name}.
        </div>
      )}
    </div>
  );
}
