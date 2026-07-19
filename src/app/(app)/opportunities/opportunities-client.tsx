"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Target, MapPin, Clock, Zap, TrendingUp, Eye, MessageSquare, Bookmark, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/app-store";
import { CompanyAvatar } from "@/components/ui/primitives";
import { dismissMatch, markMatchOpened } from "@/lib/opportunity-actions";
import type { OpportunityCard, CompanyOpportunityPreferences } from "@/lib/types";

const TABS = [
  { id: "for_you", label: "Voor jou", icon: Target },
  { id: "new", label: "Nieuw", icon: null },
  { id: "urgent", label: "Urgent", icon: Zap },
  { id: "viewed", label: "Bekeken", icon: Eye },
  { id: "responded", label: "Gereageerd", icon: MessageSquare },
  { id: "saved", label: "Opgeslagen", icon: Bookmark },
  { id: "not_relevant", label: "Niet relevant", icon: X },
  { id: "mine", label: "Door jou geplaatst", icon: null },
];

const URGENCY_LABELS: Record<string, string> = {
  normal: "Normaal",
  week: "Binnen een week",
  hours_48: "Binnen 48 uur",
  urgent_today: "Spoed vandaag",
};

const URGENCY_COLORS: Record<string, string> = {
  normal: "text-muted",
  week: "text-yellow-600 dark:text-yellow-500",
  hours_48: "text-orange-600 dark:text-orange-500",
  urgent_today: "text-red-600 dark:text-red-500",
};

const BUDGET_LABELS: Record<string, string> = {
  fixed: "Vast budget",
  range: "Budgetrange",
  per_hour: "Per uur",
  per_unit: "Per stuk",
  per_project: "Per project",
  open: "Budget in overleg",
  discuss: "Eerst bespreken",
};

export function OpportunitiesClient({
  initialCards,
  preferences,
  hasServices,
  companyId,
}: {
  initialCards: OpportunityCard[];
  preferences: CompanyOpportunityPreferences;
  hasServices: boolean;
  companyId: string;
}) {
  const { me, toast } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("for_you");
  const [cards, setCards] = useState(initialCards);
  const [loading, setLoading] = useState(false);

  const switchTab = async (tab: string) => {
    setActiveTab(tab);
    setLoading(true);
    try {
      const res = await fetch(`/api/opportunities?tab=${tab}`);
      const data = await res.json();
      if (data.ok) setCards(data.cards);
    } catch {
      // keep current cards on error
    }
    setLoading(false);
  };

  const handleDismiss = async (matchId: string, reason?: string) => {
    const result = await dismissMatch(matchId, reason);
    if (result.ok) {
      setCards((prev) => prev.filter((c) => c.id !== cards.find((x) => x.matchStatus)?.id));
      toast("Aanvraag verborgen", "We laten deze kans niet meer aan je zien.");
      router.refresh();
    }
  };

  const handleOpen = async (card: OpportunityCard) => {
    // Find the match for this company — we'd need the match ID
    // For now, just navigate to detail
    router.push(`/opportunities/${card.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Kansen voor jouw bedrijf</h1>
        <p className="mt-1 text-sm text-muted">
          Zakelijke aanvragen en mogelijkheden die passen bij jouw diensten, regio en beschikbaarheid.
        </p>
      </div>

      {/* Setup warning */}
      {!hasServices && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-yellow-300/50 bg-yellow-50 p-4 dark:border-yellow-700/30 dark:bg-yellow-950/20">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
              Stel je matchingprofiel in
            </p>
            <p className="mt-0.5 text-sm text-yellow-800 dark:text-yellow-300">
              Voeg je diensten en werkgebied toe om relevante kansen te ontvangen.
            </p>
            <button
              onClick={() => router.push("/settings/opportunities")}
              className="mt-2 rounded-full bg-yellow-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-yellow-700"
            >
              Matching instellen
            </button>
          </div>
        </div>
      )}

      {/* Action button */}
      <button
        onClick={() => router.push("/opportunities/new")}
        className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3.5 text-sm font-semibold text-background transition-all hover:opacity-90 press"
      >
        <Plus size={18} strokeWidth={2.5} />
        Plaats een aanvraag
      </button>

      {/* Tabs */}
      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
              activeTab === tab.id
                ? "bg-foreground text-background"
                : "border border-border text-muted hover:bg-surface-2 hover:text-foreground"
            )}
          >
            {tab.icon && <tab.icon size={14} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="py-20 text-center text-sm text-muted">Laden…</div>
      ) : cards.length === 0 ? (
        <div className="py-20 text-center">
          <Target size={40} className="mx-auto mb-3 text-muted" />
          <p className="text-sm font-semibold">Er zijn momenteel geen nieuwe kansen</p>
          <p className="mt-1 text-sm text-muted">
            {hasServices
              ? "Zodra er aanvragen zijn die bij jouw diensten passen, verschijnen ze hier."
              : "Stel je matchingprofiel in om kansen te ontvangen."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {cards.map((card) => (
            <OpportunityCardView
              key={card.id}
              card={card}
              onOpen={() => handleOpen(card)}
              onDismiss={() => handleDismiss(card.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OpportunityCardView({
  card,
  onOpen,
  onDismiss,
}: {
  card: OpportunityCard;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const { companyById } = useApp();
  const company = companyById(card.companyId);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-foreground/20">
      {/* Top row: company + match score */}
      <div className="mb-3 flex items-center gap-3">
        <CompanyAvatar
          name={card.companyName}
          color={card.companyLogoColor}
          logoUrl={card.companyLogoUrl}
          size={36}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{card.companyName}</p>
          <p className="truncate text-xs text-muted">
            {card.companyVerified && "✓ Geverifieerd · "}
            {card.municipality ?? card.country}
          </p>
        </div>
        {card.matchScore != null && (
          <div className="shrink-0 text-right">
            <span className={cn(
              "text-lg font-bold",
              card.matchScore >= 80 ? "text-green-600 dark:text-green-500" : card.matchScore >= 60 ? "text-yellow-600 dark:text-yellow-500" : "text-muted"
            )}>
              {card.matchScore}%
            </span>
            <p className="text-[10px] text-muted">match</p>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="mb-1.5 text-[15px] font-bold leading-snug">{card.title}</h3>

      {/* Meta row */}
      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
        {card.municipality && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} /> {card.municipality}
          </span>
        )}
        {card.startDate && (
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> Start {new Date(card.startDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
          </span>
        )}
        <span className={cn("inline-flex items-center gap-1 font-medium", URGENCY_COLORS[card.urgency])}>
          <Zap size={12} /> {URGENCY_LABELS[card.urgency]}
        </span>
      </div>

      {/* Description */}
      {card.description && (
        <p className="mb-3 line-clamp-2 text-sm text-muted">{card.description}</p>
      )}

      {/* Budget + responses */}
      <div className="mb-3 flex items-center gap-3 text-xs">
        <span className="font-medium">
          {card.budgetType === "open" || card.budgetType === "discuss"
            ? BUDGET_LABELS[card.budgetType]
            : card.budgetMin != null
              ? `€${card.budgetMin}${card.budgetMax != null ? `–${card.budgetMax}` : ""}`
              : "Budget in overleg"}
        </span>
        {card.responseCount > 0 && (
          <span className="text-muted">{card.responseCount} reactie{card.responseCount > 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Match reasons */}
      {card.matchReasons && card.matchReasons.length > 0 && (
        <div className="mb-3 rounded-xl bg-surface-2 p-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Waarom dit bij jou past</p>
          <ul className="space-y-0.5">
            {card.matchReasons.slice(0, 3).map((reason, i) => (
              <li key={i} className="text-xs text-muted">• {reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpen}
          className="flex-1 rounded-full bg-foreground px-4 py-2.5 text-xs font-semibold text-background transition-opacity hover:opacity-90"
        >
          Bekijk aanvraag
        </button>
        <button
          onClick={onOpen}
          className="rounded-full border border-border px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-surface-2"
        >
          Ik ben geïnteresseerd
        </button>
        <button
          onClick={onDismiss}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted transition-colors hover:bg-surface-2"
          aria-label="Niet relevant"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
