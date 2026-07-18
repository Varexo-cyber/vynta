"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Search, ArrowRight } from "lucide-react";
import { useApp } from "@/components/app-store";
import { toggleNetworkFollow } from "@/lib/actions";
import { formatNumber, cn } from "@/lib/utils";
import { networkEmoji } from "@/lib/network-emoji";
import type { Network } from "@/lib/types";

const TYPE_EXPLANATION: Record<Network["type"], string> = {
  municipality: "Jouw bedrijf is gevestigd in deze gemeente.",
  province: "Jouw bedrijf is gevestigd in deze provincie.",
  industry: "Dit is een branche waarin jouw bedrijf actief is.",
  national: "Het landelijke netwerk van Vynta.",
};

const TYPE_LABEL: Record<Network["type"], string> = {
  municipality: "Gemeente",
  province: "Provincie",
  industry: "Branche",
  national: "Landelijk",
};

function NetworkCardLarge({
  network,
  status,
  onToggle,
  index = 0,
}: {
  network: Network;
  status: "connected" | "follow" | "followed";
  onToggle?: () => void;
  index?: number;
}) {
  const emoji = networkEmoji(network);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.25) }}
      className="group flex flex-col rounded-3xl border border-border bg-surface p-5 transition-all hover:border-border-strong hover:bg-surface-2/40 hover:shadow-sm"
    >
      <div className="flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-surface-2 text-[22px] transition-colors group-hover:bg-surface-3">
          {emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              {TYPE_LABEL[network.type]}
            </span>
            {status === "connected" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                <Check size={10} /> Verbonden
              </span>
            )}
            {status === "followed" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">
                <Check size={10} /> Gevolgd
              </span>
            )}
          </div>
          <Link href={`/networks/${network.id}`} className="mt-1 block">
            <p className="text-lg font-semibold leading-tight text-foreground group-hover:underline">
              {network.name}
            </p>
          </Link>
          <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-2">
            {TYPE_EXPLANATION[network.type] || network.description}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {network.members > 0 && (
            <span className="rounded-full bg-surface-2 px-2.5 py-1 font-medium">
              {formatNumber(network.members)} aangesloten
            </span>
          )}
          {network.activeToday > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {formatNumber(network.activeToday)} actief vandaag
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {status === "connected" ? (
            <Link
              href={`/networks/${network.id}`}
              className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-all hover:opacity-90"
            >
              Open netwerk <ArrowRight size={14} />
            </Link>
          ) : (
            <button
              onClick={onToggle}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition-all press",
                status === "followed"
                  ? "border border-border bg-transparent text-foreground hover:bg-surface-2"
                  : "bg-foreground text-background hover:opacity-90"
              )}
            >
              {status === "followed" ? <><Check size={14} /> Gevolgd</> : "Volgen"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 mt-10">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
  );
}

export default function NetworksPage() {
  const { networks, myNetworks, followedNetworkIds } = useApp();
  const [followed, setFollowed] = useState(followedNetworkIds);
  const [query, setQuery] = useState("");

  const connectedIds = useMemo(() => new Set(myNetworks.map((n) => n.id)), [myNetworks]);

  const connected = useMemo(() => {
    const order: Network["type"][] = ["municipality", "province", "industry", "national"];
    const sorted = [...myNetworks].sort(
      (a, b) => order.indexOf(a.type) - order.indexOf(b.type) || a.name.localeCompare(b.name)
    );
    return sorted;
  }, [myNetworks]);

  const discoverIndustries = useMemo(() => {
    return networks
      .filter((n) => n.type === "industry" && !connectedIds.has(n.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [networks, connectedIds]);

  const municipalities = useMemo(
    () => networks.filter((n) => n.type === "municipality" && !connectedIds.has(n.id)),
    [networks, connectedIds]
  );

  const filteredMunicipalities = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return municipalities.filter((n) => n.name.toLowerCase().includes(q));
  }, [municipalities, query]);

  const toggleFollow = (id: string) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    void toggleNetworkFollow(id);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-32 pt-5 lg:pt-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Netwerken</h1>
        <p className="mt-2 max-w-2xl text-base text-muted">
          De netwerken waar jouw bedrijf toe behoort, en branches of gemeenten die je volgt.
        </p>
      </div>

      <SectionTitle
        title="Jouw netwerken"
        subtitle="Deze netwerken horen automatisch bij jouw bedrijf."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {connected.map((n, i) => (
          <NetworkCardLarge key={n.id} network={n} status="connected" index={i} />
        ))}
        {connected.length === 0 && (
          <p className="text-sm text-muted">
            We kunnen nog geen netwerken tonen. Vul je bedrijfsadres en branche in via instellingen.
          </p>
        )}
      </div>

      <SectionTitle
        title="Ontdek branches"
        subtitle="Volg extra branches om meer relevante posts in je feed te zien."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {discoverIndustries.map((n, i) => (
          <NetworkCardLarge
            key={n.id}
            network={n}
            status={followed.has(n.id) ? "followed" : "follow"}
            onToggle={() => toggleFollow(n.id)}
            index={i}
          />
        ))}
      </div>

      <SectionTitle
        title="Ontdek gemeenten"
        subtitle="Zoek een gemeente om posts uit die regio te volgen."
      />
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek een gemeente"
          className="w-full rounded-2xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted focus:border-border-strong focus:bg-surface-2"
        />
      </div>
      {query.trim() ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMunicipalities.map((n, i) => (
            <NetworkCardLarge
              key={n.id}
              network={n}
              status={followed.has(n.id) ? "followed" : "follow"}
              onToggle={() => toggleFollow(n.id)}
              index={i}
            />
          ))}
          {filteredMunicipalities.length === 0 && (
            <p className="text-sm text-muted">Geen gemeente gevonden.</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted">Typ een gemeentenaam om te zoeken.</p>
      )}
    </div>
  );
}
