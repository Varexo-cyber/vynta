"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Target,
  X,
} from "lucide-react";
import { CompanyAvatar, VerifiedBadge } from "@/components/ui/primitives";
import { dismissOpportunity, toggleOpportunitySaved } from "@/lib/opportunity-actions";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/app-store";
import type {
  OpportunityListing,
  OpportunityListFilters,
  OpportunityListSort,
  OpportunityListTab,
} from "@/lib/opportunity-queries";
import type { OpportunityCard, OpportunityDraft, ServiceCategory } from "@/lib/types";

const TABS: { id: OpportunityListTab; label: string }[] = [
  { id: "for_you", label: "Voor jou" },
  { id: "new", label: "Nieuw" },
  { id: "nearby", label: "In de buurt" },
  { id: "sector", label: "Mijn sector" },
  { id: "saved", label: "Opgeslagen" },
  { id: "mine", label: "Mijn kansen" },
];

const TYPE_LABELS: Record<string, string> = {
  request: "Opdracht",
  job: "Personeel gezocht",
  sourcing: "Inkoopvraag",
  offer: "Aanbod",
  capacity: "Capaciteit",
  partnership: "Samenwerking",
  urgent: "Spoedvraag",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Open",
  paused: "Gepauzeerd",
  matching: "Wordt gematcht",
  responses_received: "Reacties ontvangen",
  in_conversation: "In behandeling",
  party_selected: "Partij gekozen",
  preparing_deal: "In behandeling",
  completed: "Gesloten",
  cancelled: "Geannuleerd",
  expired: "Verlopen",
};

const SORTS: { value: OpportunityListSort; label: string }[] = [
  { value: "relevant", label: "Meest relevant" },
  { value: "newest", label: "Nieuwste eerst" },
  { value: "deadline", label: "Deadline eerst" },
  { value: "budget_high", label: "Hoogste budget" },
  { value: "nearby", label: "Dichtstbij" },
];

export function OpportunitiesClient({
  listing,
  filters,
  hasServices,
  categories,
  drafts,
}: {
  listing: OpportunityListing;
  filters: OpportunityListFilters;
  hasServices: boolean;
  categories: ServiceCategory[];
  drafts: OpportunityDraft[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { toast } = useApp();
  const [isPending, startTransition] = useTransition();
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [savedOverrides, setSavedOverrides] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);
  const cards = listing.cards
    .filter((card) => !hiddenIds.includes(card.id))
    .map((card) => card.id in savedOverrides ? { ...card, saved: savedOverrides[card.id] } : card);

  const updateQuery = (updates: Record<string, string | undefined>, replace = false) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    if (!("page" in updates)) next.delete("page");
    const url = `${pathname}${next.size ? `?${next.toString()}` : ""}`;
    startTransition(() => replace ? router.replace(url, { scroll: false }) : router.push(url, { scroll: false }));
  };

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (filters.type) chips.push({ key: "type", label: TYPE_LABELS[filters.type] ?? filters.type });
    if (filters.location) chips.push({ key: "location", label: filters.location === "remote" ? "Op afstand" : filters.location });
    if (filters.sector) chips.push({ key: "sector", label: categories.find((category) => category.id === filters.sector)?.name ?? "Sector" });
    if (filters.date) chips.push({ key: "date", label: filters.date === "today" ? "Vandaag" : filters.date === "week" ? "Afgelopen week" : "Afgelopen maand" });
    if (filters.status) chips.push({ key: "status", label: filters.status === "closed" ? "Gesloten" : STATUS_LABELS[filters.status] ?? filters.status });
    return chips;
  }, [categories, filters]);

  const resetFilters = () => updateQuery({ type: undefined, location: undefined, sector: undefined, date: undefined, status: undefined, sort: undefined });

  const toggleSaved = async (card: OpportunityCard) => {
    try {
      const result = await toggleOpportunitySaved(card.id);
      if (!result.ok) return toast("Opslaan mislukt", result.error ?? "Probeer het opnieuw.");
      setSavedOverrides((current) => ({ ...current, [card.id]: Boolean(result.saved) }));
      if (filters.tab === "saved" && !result.saved) setHiddenIds((current) => [...current, card.id]);
      toast(result.saved ? "Kans opgeslagen" : "Niet meer opgeslagen", result.saved ? "Je vindt deze terug onder Opgeslagen." : "");
      router.refresh();
    } catch {
      toast("Opslaan mislukt", "Controleer je verbinding en probeer het opnieuw.");
    }
  };

  const dismiss = async (card: OpportunityCard) => {
    try {
      const result = await dismissOpportunity(card.id);
      if (!result.ok) return toast("Actie mislukt", result.error ?? "Probeer het opnieuw.");
      setHiddenIds((current) => [...current, card.id]);
      toast("Kans verborgen", "Deze kans verschijnt niet meer in je overzicht.");
      router.refresh();
    } catch {
      toast("Actie mislukt", "Controleer je verbinding en probeer het opnieuw.");
    }
  };

  const emptyTitle = filters.tab === "mine" ? "Je hebt nog geen kansen geplaatst" : filters.tab === "saved" ? "Nog niets opgeslagen" : "Geen kansen gevonden";
  const emptyBody = activeFilters.length || filters.query
    ? "Pas je zoekopdracht of filters aan om meer resultaten te zien."
    : "Nieuwe zakelijke kansen verschijnen hier zodra bedrijven ze plaatsen.";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-9 xl:px-8">
      <header className="mb-7 flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand">Zakelijke kansen</p>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Kansen</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-[15px]">
            Vind opdrachten, leveranciers en samenwerkingen die aansluiten op je bedrijf.
          </p>
        </div>
        <Link href="/opportunities/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 focus-ring press">
          <Plus size={17} /> Plaats een kans
        </Link>
      </header>

      {!hasServices && filters.tab === "for_you" && (
        <aside className="mb-5 flex items-start gap-3 border-l-2 border-brand bg-surface px-4 py-3" aria-label="Matchingprofiel instellen">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-brand" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Maak je resultaten relevanter</p>
            <p className="mt-0.5 text-sm text-muted">Voeg diensten en werkgebieden toe aan je matchingprofiel.</p>
          </div>
          <Link href="/settings/opportunities" className="shrink-0 text-sm font-semibold underline decoration-border-strong underline-offset-4">Instellen</Link>
        </aside>
      )}

      <nav className="no-scrollbar mb-5 flex gap-1 overflow-x-auto border-b border-border" aria-label="Kansoverzichten">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" onClick={() => updateQuery({ tab: tab.id === "for_you" ? undefined : tab.id })} className={cn("relative shrink-0 px-3 py-3 text-sm font-semibold transition-colors focus-ring", filters.tab === tab.id ? "text-foreground" : "text-muted hover:text-foreground") } aria-current={filters.tab === tab.id ? "page" : undefined}>
            {tab.label}
            {filters.tab === tab.id && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand" />}
          </button>
        ))}
      </nav>

      <section className="mb-6" aria-label="Zoeken en filteren">
        <div className="flex flex-col gap-2 sm:flex-row">
          <form className="relative flex-1" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); updateQuery({ q: String(data.get("q") ?? "") || undefined }); }}>
            <span className="sr-only">Kansen zoeken</span>
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input key={filters.query ?? ""} name="q" defaultValue={filters.query ?? ""} placeholder="Zoek naar opdrachten, partners, leveranciers of diensten" className="h-12 w-full rounded-xl border border-border bg-surface pl-11 pr-20 text-sm outline-none transition-colors placeholder:text-subtle focus:border-foreground/40 focus:ring-2 focus:ring-foreground/5" />
            <button type="submit" className="absolute right-2 top-1/2 h-8 -translate-y-1/2 rounded-full px-3 text-xs font-semibold text-muted hover:bg-surface-2 hover:text-foreground">Zoek</button>
          </form>
          <button type="button" onClick={() => setShowFilters((open) => !open)} className={cn("inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors focus-ring", showFilters || activeFilters.length ? "border-foreground bg-foreground text-background" : "border-border bg-surface hover:border-border-strong")} aria-expanded={showFilters}>
            <Filter size={17} /> Filters {activeFilters.length > 0 && <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] text-brand-fg">{activeFilters.length}</span>}
          </button>
        </div>

        {showFilters && (
          <div className="mt-2 grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
            <FilterSelect label="Type" value={filters.type ?? ""} onChange={(value) => updateQuery({ type: value || undefined })} options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))} />
            <FilterText label="Locatie" value={filters.location ?? ""} onSubmit={(value) => updateQuery({ location: value || undefined })} />
            <FilterSelect label="Sector" value={filters.sector ?? ""} onChange={(value) => updateQuery({ sector: value || undefined })} options={categories.filter((category) => category.level === 0).map((category) => ({ value: category.id, label: category.name }))} />
            <FilterSelect label="Geplaatst" value={filters.date ?? ""} onChange={(value) => updateQuery({ date: value || undefined })} options={[{ value: "today", label: "Vandaag" }, { value: "week", label: "Afgelopen week" }, { value: "month", label: "Afgelopen maand" }]} />
            <FilterSelect label="Status" value={filters.status ?? ""} onChange={(value) => updateQuery({ status: value || undefined })} options={[{ value: "active", label: "Open" }, { value: "responses_received", label: "Reacties ontvangen" }, { value: "in_conversation", label: "In behandeling" }, { value: "paused", label: "Gepauzeerd" }, { value: "expired", label: "Verlopen" }, { value: "closed", label: "Gesloten" }]} />
          </div>
        )}

        {activeFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeFilters.map((chip) => <button key={chip.key} type="button" onClick={() => updateQuery({ [chip.key]: undefined })} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:border-border-strong"><span>{chip.label}</span><X size={12} /></button>)}
            <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-muted hover:text-foreground"><RotateCcw size={12} /> Wis filters</button>
          </div>
        )}
      </section>

      {filters.tab === "mine" && drafts.length > 0 && (
        <section className="mb-7" aria-labelledby="drafts-title">
          <div className="mb-3 flex items-center justify-between"><h2 id="drafts-title" className="text-sm font-semibold">Concepten</h2><span className="text-xs text-muted">{drafts.length}</span></div>
          <div className="grid gap-2 md:grid-cols-2">
            {drafts.map((draft) => <DraftRow key={draft.id} draft={draft} />)}
          </div>
        </section>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted"><strong className="font-semibold text-foreground">{listing.total}</strong> {listing.total === 1 ? "resultaat" : "resultaten"}</p>
        <label className="flex items-center gap-2 text-sm text-muted"><span className="hidden sm:inline">Sorteer op</span><select value={filters.sort ?? (filters.tab === "new" ? "newest" : "relevant")} onChange={(event) => updateQuery({ sort: event.target.value === "relevant" ? undefined : event.target.value })} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground outline-none focus:border-foreground/40">{SORTS.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}</select></label>
      </div>

      <div className={cn("space-y-3 transition-opacity", isPending && "pointer-events-none opacity-55")} aria-busy={isPending}>
        {cards.length ? cards.map((card) => <OpportunityCardView key={card.id} card={card} mine={filters.tab === "mine"} onSave={() => toggleSaved(card)} onDismiss={() => dismiss(card)} />) : (
          <div className="border-y border-border py-16 text-center">
            <Target size={30} className="mx-auto mb-4 text-subtle" />
            <h2 className="text-lg font-semibold">{emptyTitle}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{emptyBody}</p>
            {activeFilters.length > 0 ? <button type="button" onClick={resetFilters} className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-surface"><RotateCcw size={15} /> Wis filters</button> : <Link href="/opportunities/new" className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"><Plus size={15} /> Plaats een kans</Link>}
          </div>
        )}
      </div>

      {listing.totalPages > 1 && (
        <nav className="mt-7 flex items-center justify-between border-t border-border pt-5" aria-label="Resultaatpagina's">
          <button type="button" disabled={listing.page <= 1} onClick={() => updateQuery({ page: String(listing.page - 1) })} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold disabled:opacity-35"><ChevronLeft size={16} /> Vorige</button>
          <span className="text-sm text-muted">Pagina {listing.page} van {listing.totalPages}</span>
          <button type="button" disabled={listing.page >= listing.totalPages} onClick={() => updateQuery({ page: String(listing.page + 1) })} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold disabled:opacity-35">Volgende <ChevronRight size={16} /></button>
        </nav>
      )}
    </main>
  );
}

function OpportunityCardView({ card, mine, onSave, onDismiss }: { card: OpportunityCard; mine: boolean; onSave: () => void; onDismiss: () => void }) {
  const published = card.publishedAt ?? card.createdAt;
  const deadline = card.responseDeadline ? new Date(card.responseDeadline) : null;
  const location = card.locationType === "remote" ? "Op afstand" : [card.municipality, card.province].filter(Boolean).join(", ") || card.country;
  const budget = card.budgetType === "open" || card.budgetType === "discuss" ? "Budget in overleg" : card.budgetMin != null ? `€ ${new Intl.NumberFormat("nl-NL").format(card.budgetMin)}${card.budgetMax != null ? ` – € ${new Intl.NumberFormat("nl-NL").format(card.budgetMax)}` : ""}` : "Prijs op aanvraag";

  return (
    <article className="group rounded-xl border border-border bg-surface px-4 py-4 transition-colors hover:border-border-strong sm:px-5 sm:py-5">
      <div className="flex gap-3 sm:gap-4">
        <CompanyAvatar name={card.companyName} color={card.companyLogoColor} logoUrl={card.companyLogoUrl} size={42} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="rounded-md bg-surface-2 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{TYPE_LABELS[card.opportunityType] ?? "Kans"}</span>
            <span className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-muted"><span className="truncate">{card.companyName}</span>{card.companyVerified && <VerifiedBadge size={14} />}</span>
            {mine && <span className="ml-auto rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold">{STATUS_LABELS[card.status] ?? card.status}</span>}
          </div>
          <Link href={`/opportunities/${card.id}`} className="mt-2 block focus-ring"><h2 className="text-[17px] font-semibold leading-snug tracking-[-0.025em] group-hover:underline group-hover:decoration-border-strong group-hover:underline-offset-4 sm:text-lg">{card.title}</h2></Link>
          {card.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{card.description}</p>}
          <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
            {card.categoryPath && <div className="inline-flex items-center gap-1.5"><BriefcaseBusiness size={13} /><span>{card.categoryPath}</span></div>}
            <div className="inline-flex items-center gap-1.5"><MapPin size={13} /><span>{location}</span></div>
            <div className="inline-flex items-center gap-1.5"><CalendarDays size={13} /><span>{new Date(published).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</span></div>
            {deadline && <div className="inline-flex items-center gap-1.5"><Clock3 size={13} /><span>Reageren vóór {deadline.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</span></div>}
          </dl>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="mr-auto text-sm font-semibold">{budget}</span>
            {card.responseCount > 0 && <span className="text-xs text-muted">{card.responseCount} {card.responseCount === 1 ? "reactie" : "reacties"}</span>}
            {!mine && <button type="button" onClick={onSave} className={cn("grid h-9 w-9 place-items-center rounded-full border transition-colors focus-ring", card.saved ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:text-foreground")} aria-label={card.saved ? "Verwijder uit opgeslagen" : "Sla kans op"} aria-pressed={card.saved}><Bookmark size={16} fill={card.saved ? "currentColor" : "none"} /></button>}
            {!mine && <button type="button" onClick={onDismiss} className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted hover:bg-surface-2 hover:text-foreground focus-ring" aria-label="Niet relevant"><X size={16} /></button>}
            <Link href={`/opportunities/${card.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-xs font-semibold text-background transition-opacity hover:opacity-90 focus-ring">Bekijken <ArrowRight size={14} /></Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <label className="grid gap-1.5 text-xs font-semibold text-muted"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground outline-none focus:border-foreground/40"><option value="">Alle</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function FilterText({ label, value, onSubmit }: { label: string; value: string; onSubmit: (value: string) => void }) {
  return <form onSubmit={(event) => { event.preventDefault(); onSubmit(String(new FormData(event.currentTarget).get("location") ?? "").trim()); }} className="grid gap-1.5 text-xs font-semibold text-muted"><label htmlFor="opportunity-location">{label}</label><div className="relative"><input key={value} id="opportunity-location" name="location" defaultValue={value === "remote" ? "" : value} placeholder="Plaats of provincie" className="h-10 w-full rounded-lg border border-border bg-background px-3 pr-12 text-sm font-medium text-foreground outline-none focus:border-foreground/40" /><button type="submit" className="absolute right-1 top-1 h-8 rounded-md px-2 text-[11px] font-semibold hover:bg-surface-2">OK</button></div><button type="button" onClick={() => onSubmit(value === "remote" ? "" : "remote")} className="text-left text-[11px] font-medium text-muted underline underline-offset-2">{value === "remote" ? "Alle locaties tonen" : "Alleen op afstand"}</button></form>;
}

function DraftRow({ draft }: { draft: OpportunityDraft }) {
  const data = draft.data as { title?: string; description?: string };
  return <Link href={`/opportunities/new?draft=${draft.id}`} className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-surface px-4 py-3 hover:border-border-strong"><SlidersHorizontal size={17} className="text-muted" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{data.title || "Naamloos concept"}</p><p className="text-xs text-muted">Bijgewerkt {new Date(draft.updatedAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</p></div><ChevronRight size={16} className="text-muted" /></Link>;
}
