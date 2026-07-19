"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Clock3,
  Edit3,
  ExternalLink,
  Loader2,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Pause,
  Play,
  Send,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { CompanyAvatar, VerifiedBadge } from "@/components/ui/primitives";
import { useApp } from "@/components/app-store";
import {
  askQuestion,
  deleteOpportunity,
  markOpportunityOpened,
  respondToOpportunity,
  startOpportunityConversation,
  toggleOpportunitySaved,
  triggerExpansionRound,
  updateOpportunityResponseStatus,
  updateOpportunityStatus,
  withdrawResponse,
} from "@/lib/opportunity-actions";
import { cn } from "@/lib/utils";
import type { DistributionRound, Opportunity, OpportunityMatch, OpportunityResponse, ResponseStatus } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  draft: "Concept",
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

const TYPE_LABELS: Record<string, string> = {
  request: "Opdracht",
  job: "Personeel gezocht",
  sourcing: "Leverancier gezocht",
  offer: "Zakelijk aanbod",
  capacity: "Capaciteit",
  partnership: "Samenwerking",
  urgent: "Spoedvraag",
};

const RESPONSE_STATUS: Record<ResponseStatus, string> = {
  interested: "Nieuw",
  question: "Vraag",
  shortlisted: "Shortlist",
  selected: "Geaccepteerd",
  not_selected: "Afgewezen",
  withdrawn: "Ingetrokken",
};

export function OpportunityDetailClient({
  opportunity,
  responses,
  categoryPath,
  isOwner,
  myCompanyId,
  matches = [],
  rounds = [],
  initiallySaved,
  deadlineExpired,
}: {
  opportunity: Opportunity;
  responses: OpportunityResponse[];
  categoryPath: string;
  isOwner: boolean;
  myCompanyId: string;
  matches?: OpportunityMatch[];
  rounds?: DistributionRound[];
  initiallySaved: boolean;
  deadlineExpired: boolean;
}) {
  const router = useRouter();
  const { companyById, toast } = useApp();
  const company = companyById(opportunity.companyId);
  const myResponse = responses.find((response) => response.respondingCompanyId === myCompanyId);
  const [saved, setSaved] = useState(initiallySaved);
  const [responding, setResponding] = useState(false);
  const [asking, setAsking] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deadline = opportunity.responseDeadline ? new Date(opportunity.responseDeadline) : null;
  const openForResponses = ["active", "matching", "responses_received"].includes(opportunity.status) && !deadlineExpired;
  const location = opportunity.locationType === "remote" ? "Op afstand" : [opportunity.municipality, opportunity.province].filter(Boolean).join(", ") || opportunity.country;

  useEffect(() => {
    if (!isOwner) void markOpportunityOpened(opportunity.id);
  }, [isOwner, opportunity.id]);

  const run = async (key: string, action: () => Promise<{ ok: boolean; error?: string }>, successTitle: string, successBody = "") => {
    setPending(key);
    setError(null);
    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "Er ging iets mis. Probeer het opnieuw.");
        toast("Actie mislukt", result.error ?? "Probeer het opnieuw.");
        return false;
      }
      toast(successTitle, successBody);
      router.refresh();
      return true;
    } catch {
      setError("De verbinding werd onderbroken. Probeer het opnieuw.");
      toast("Actie mislukt", "Controleer je verbinding en probeer het opnieuw.");
      return false;
    } finally {
      setPending(null);
    }
  };

  const toggleSaved = async () => {
    setPending("save");
    try {
      const result = await toggleOpportunitySaved(opportunity.id);
      if (!result.ok) return toast("Opslaan mislukt", result.error ?? "Probeer het opnieuw.");
      setSaved(Boolean(result.saved));
      toast(result.saved ? "Kans opgeslagen" : "Niet meer opgeslagen", "");
    } catch {
      toast("Opslaan mislukt", "Controleer je verbinding en probeer het opnieuw.");
    } finally {
      setPending(null);
    }
  };

  const changeStatus = (status: string, title: string) => run(`status-${status}`, () => updateOpportunityStatus(opportunity.id, status), title);

  const remove = async () => {
    if (!window.confirm("Deze kans en alle reacties definitief verwijderen? Dit kan niet ongedaan worden gemaakt.")) return;
    const success = await run("delete", () => deleteOpportunity(opportunity.id), "Kans verwijderd");
    if (success) router.push("/opportunities?tab=mine");
  };

  const updateResponse = (responseId: string, status: "shortlisted" | "selected" | "not_selected") => run(`response-${responseId}-${status}`, () => updateOpportunityResponseStatus(opportunity.id, responseId, status), status === "selected" ? "Reactie geaccepteerd" : status === "shortlisted" ? "Toegevoegd aan shortlist" : "Reactie afgewezen");

  const startConversation = async (response: OpportunityResponse) => {
    setPending(`message-${response.id}`);
    try {
      const result = await startOpportunityConversation(opportunity.id, response.respondingCompanyId);
      if (!result.ok || !result.conversationId) return toast("Gesprek starten mislukt", result.error ?? "Probeer het opnieuw.");
      router.push(`/messages/${result.conversationId}`);
    } catch {
      toast("Gesprek starten mislukt", "Controleer je verbinding en probeer het opnieuw.");
    } finally {
      setPending(null);
    }
  };

  const budget = opportunity.budgetType === "open" || opportunity.budgetType === "discuss"
    ? "Budget in overleg"
    : opportunity.budgetMin != null
      ? `€ ${new Intl.NumberFormat("nl-NL").format(opportunity.budgetMin)}${opportunity.budgetMax != null ? ` – € ${new Intl.NumberFormat("nl-NL").format(opportunity.budgetMax)}` : ""}`
      : "Prijs op aanvraag";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-9 xl:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/opportunities" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted hover:text-foreground focus-ring"><ArrowLeft size={16} /> Terug naar kansen</Link>
        <div className="flex items-center gap-2">
          {!isOwner && <button type="button" onClick={() => void toggleSaved()} disabled={pending === "save"} className={cn("inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors", saved ? "border-foreground bg-foreground text-background" : "border-border hover:bg-surface")} aria-pressed={saved}><Bookmark size={15} fill={saved ? "currentColor" : "none"} />{saved ? "Opgeslagen" : "Opslaan"}</button>}
          {isOwner && <Link href={`/opportunities/${opportunity.id}/edit`} className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-surface"><Edit3 size={15} /> Bewerken</Link>}
        </div>
      </div>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <article className="rounded-xl border border-border bg-surface p-5 sm:p-7">
            <div className="flex items-start gap-3">
              <CompanyAvatar name={company?.name ?? "Onbekend bedrijf"} color={company?.logoColor ?? "#171717"} logoUrl={company?.logoUrl} size={46} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5"><span className="truncate text-sm font-semibold">{company?.name ?? "Onbekend bedrijf"}</span>{company?.verified && <VerifiedBadge size={15} />}</div>
                <p className="mt-0.5 text-xs text-muted">Geplaatst {new Date(opportunity.publishedAt ?? opportunity.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", openForResponses ? "border-green-700/20 bg-green-600/10 text-green-700 dark:text-green-400" : "border-border text-muted")}>{deadlineExpired && !isOwner ? "Reactietermijn verlopen" : STATUS_LABELS[opportunity.status] ?? opportunity.status}</span>
            </div>

            <div className="mt-7">
              <span className="rounded-md bg-surface-2 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{TYPE_LABELS[opportunity.opportunityType] ?? "Zakelijke kans"}</span>
              <h1 className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.04em] sm:text-3xl">{opportunity.title}</h1>
              {opportunity.description && <p className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-muted">{opportunity.description}</p>}
            </div>

            <dl className="mt-7 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
              <Detail label="Sector" value={categoryPath || "Niet gespecificeerd"} icon={<BriefcaseBusiness size={16} />} />
              <Detail label="Locatie" value={location} icon={<MapPin size={16} />} />
              <Detail label="Budget" value={budget} icon={<MoreHorizontal size={16} />} />
              <Detail label="Omvang" value={opportunity.quantity ? `${opportunity.quantity}${opportunity.unit ? ` ${opportunity.unit}` : ""}` : "Niet gespecificeerd"} icon={<Users size={16} />} />
              <Detail label="Start" value={opportunity.startDate ? new Date(opportunity.startDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }) : "In overleg"} icon={<CalendarDays size={16} />} />
              <Detail label="Reageren vóór" value={deadline ? deadline.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }) : "Geen vaste deadline"} icon={<Clock3 size={16} />} />
            </dl>

            <div className="mt-6 flex items-start gap-2 border-l-2 border-border-strong pl-3 text-xs leading-5 text-muted"><ShieldCheck size={15} className="mt-0.5 shrink-0" /><p>Deel contactgegevens en vertrouwelijke documenten pas in een privégesprek nadat je hebt vastgesteld dat een bedrijf past.</p></div>
          </article>

          {isOwner ? (
            <OwnerResponses responses={responses} pending={pending} onStatus={updateResponse} onMessage={startConversation} companyById={companyById} />
          ) : (
            <ResponseArea opportunity={opportunity} myResponse={myResponse} open={openForResponses} responding={responding} setResponding={setResponding} asking={asking} setAsking={setAsking} pending={pending} setPending={setPending} error={error} setError={setError} onRefresh={() => router.refresh()} toast={toast} />
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          {isOwner ? (
            <div className="rounded-xl border border-border bg-surface p-5">
              <h2 className="text-base font-semibold">Beheer deze kans</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Status: <strong className="font-semibold text-foreground">{STATUS_LABELS[opportunity.status] ?? opportunity.status}</strong></p>
              <div className="mt-4 grid grid-cols-2 gap-2 border-y border-border py-4 text-center"><Stat value={responses.filter((response) => response.status !== "question").length} label="Reacties" /><Stat value={matches.length} label="Matches" /></div>
              <div className="mt-4 grid gap-2">
                <Link href={`/opportunities/${opportunity.id}/edit`} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-foreground px-4 text-sm font-semibold text-background"><Edit3 size={15} /> Bewerken</Link>
                {["active", "matching", "responses_received", "in_conversation"].includes(opportunity.status) && <button type="button" onClick={() => void changeStatus("paused", "Kans gepauzeerd")} disabled={pending === "status-paused"} className="owner-action"><Pause size={15} /> Pauzeren</button>}
                {["paused", "expired", "cancelled"].includes(opportunity.status) && <button type="button" onClick={() => void changeStatus("active", "Kans opnieuw gepubliceerd")} disabled={pending === "status-active"} className="owner-action"><Play size={15} /> Opnieuw publiceren</button>}
                {!['completed', 'cancelled'].includes(opportunity.status) && <button type="button" onClick={() => void changeStatus("completed", "Kans gesloten")} disabled={pending === "status-completed"} className="owner-action"><Check size={15} /> Markeer als afgehandeld</button>}
                <button type="button" onClick={() => void remove()} disabled={pending === "delete"} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-red-300/50 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/20"><Trash2 size={15} /> Verwijderen</button>
              </div>
              {(["active", "matching"].includes(opportunity.status)) && <button type="button" onClick={() => void run("expand", () => triggerExpansionRound(opportunity.id), "Nieuwe matchronde gestart")} disabled={pending === "expand"} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 border-t border-border pt-4 text-xs font-semibold text-muted hover:text-foreground">{pending === "expand" ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />} Zoek meer matches ({rounds.length} rondes)</button>}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-5">
              <h2 className="text-base font-semibold">Past deze kans?</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Reageer met een korte, concrete toelichting. Prijs en beschikbaarheid zijn optioneel.</p>
              {openForResponses && !myResponse && <button type="button" onClick={() => setResponding(true)} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-brand-fg"><MessageSquare size={16} /> Reageren</button>}
              {!openForResponses && <p className="mt-4 rounded-lg bg-surface-2 p-3 text-sm text-muted">Deze kans staat niet meer open voor reacties.</p>}
              {myResponse && <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400"><Check size={16} /> Je hebt gereageerd</p>}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function OwnerResponses({ responses, pending, onStatus, onMessage, companyById }: { responses: OpportunityResponse[]; pending: string | null; onStatus: (id: string, status: "shortlisted" | "selected" | "not_selected") => Promise<boolean>; onMessage: (response: OpportunityResponse) => Promise<void>; companyById: ReturnType<typeof useApp>["companyById"] }) {
  return <section className="mt-7" aria-labelledby="responses-title"><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Privé</p><h2 id="responses-title" className="mt-1 text-xl font-semibold">Reacties en vragen</h2></div><span className="text-sm text-muted">{responses.length}</span></div>{responses.length ? <div className="space-y-3">{responses.map((response) => { const company = companyById(response.respondingCompanyId); const actionable = response.status !== "question"; return <article key={response.id} className="rounded-xl border border-border bg-surface p-4 sm:p-5"><div className="flex items-start gap-3"><CompanyAvatar name={company?.name ?? "Onbekend bedrijf"} color={company?.logoColor ?? "#171717"} logoUrl={company?.logoUrl} size={40} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><span className="font-semibold">{company?.name ?? "Onbekend bedrijf"}</span>{company?.verified && <VerifiedBadge size={15} />}<span className="ml-auto rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold">{RESPONSE_STATUS[response.status]}</span></div><p className="mt-1 text-xs text-muted">{company?.city || company?.province || "Nederland"} · {new Date(response.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">{response.message}</p><div className="mt-3 flex flex-wrap gap-3 text-xs font-medium">{response.availableFrom && <span>Beschikbaar vanaf {new Date(response.availableFrom).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</span>}{response.priceMin != null && <span>Indicatie € {new Intl.NumberFormat("nl-NL").format(response.priceMin)}{response.priceMax != null ? ` – € ${new Intl.NumberFormat("nl-NL").format(response.priceMax)}` : ""}</span>}</div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => void onMessage(response)} disabled={pending === `message-${response.id}`} className="response-action bg-foreground text-background"><MessageSquare size={14} /> Bericht</button>{actionable && response.status !== "selected" && <button type="button" onClick={() => void onStatus(response.id, "shortlisted")} disabled={pending === `response-${response.id}-shortlisted`} className="response-action border border-border">Shortlist</button>}{actionable && response.status !== "selected" && <button type="button" onClick={() => void onStatus(response.id, "selected")} disabled={pending === `response-${response.id}-selected`} className="response-action border border-green-700/30 text-green-700 dark:text-green-400"><Check size={14} /> Accepteren</button>}{actionable && response.status !== "not_selected" && response.status !== "selected" && <button type="button" onClick={() => void onStatus(response.id, "not_selected")} disabled={pending === `response-${response.id}-not_selected`} className="response-action border border-border text-muted"><X size={14} /> Afwijzen</button>}</div></div></div></article>; })}</div> : <div className="rounded-xl border border-dashed border-border py-12 text-center"><Users size={26} className="mx-auto text-subtle" /><p className="mt-3 text-sm font-semibold">Nog geen reacties</p><p className="mt-1 text-sm text-muted">Je ziet reacties hier zodra een bedrijf interesse toont.</p></div>}</section>;
}

function ResponseArea({ opportunity, myResponse, open, responding, setResponding, asking, setAsking, pending, setPending, error, setError, onRefresh, toast }: { opportunity: Opportunity; myResponse?: OpportunityResponse; open: boolean; responding: boolean; setResponding: (value: boolean) => void; asking: boolean; setAsking: (value: boolean) => void; pending: string | null; setPending: (value: string | null) => void; error: string | null; setError: (value: string | null) => void; onRefresh: () => void; toast: (title: string, body: string) => void }) {
  const [message, setMessage] = useState(myResponse?.message ?? "");
  const [priceType, setPriceType] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [question, setQuestion] = useState("");

  const submitResponse = async () => {
    setPending("respond"); setError(null);
    try {
      const result = await respondToOpportunity(opportunity.id, { message, priceType: priceType || undefined, priceMin: priceMin ? Number(priceMin) : undefined, priceMax: priceMax ? Number(priceMax) : undefined, availableFrom: availableFrom || undefined });
      if (!result.ok) return setError(result.error ?? "Je reactie kon niet worden verzonden.");
      toast("Reactie verzonden", "De plaatser ziet je reactie in het privéoverzicht."); setResponding(false); onRefresh();
    } catch { setError("De verbinding werd onderbroken. Je tekst staat nog klaar."); }
    finally { setPending(null); }
  };
  const submitQuestion = async () => {
    setPending("question"); setError(null);
    try { const result = await askQuestion(opportunity.id, question); if (!result.ok) return setError(result.error ?? "Je vraag kon niet worden verzonden."); toast("Vraag verzonden", "De plaatser kan nu reageren."); setAsking(false); onRefresh(); }
    catch { setError("De verbinding werd onderbroken. Je vraag staat nog klaar."); }
    finally { setPending(null); }
  };
  const withdraw = async () => { setPending("withdraw"); try { const result = await withdrawResponse(opportunity.id); if (!result.ok) return toast("Intrekken mislukt", result.error ?? "Probeer het opnieuw."); toast("Reactie ingetrokken", ""); onRefresh(); } catch { toast("Intrekken mislukt", "Controleer je verbinding en probeer het opnieuw."); } finally { setPending(null); } };

  if (myResponse) return <section className="mt-7 rounded-xl border border-green-700/20 bg-green-600/5 p-5"><p className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400"><Check size={16} /> Reactie verzonden</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">{myResponse.message}</p><div className="mt-4 flex gap-3"><button type="button" onClick={() => setResponding(true)} className="text-xs font-semibold underline underline-offset-4">Reactie aanpassen</button><button type="button" onClick={() => void withdraw()} disabled={pending === "withdraw"} className="text-xs font-semibold text-muted underline underline-offset-4">Intrekken</button></div>{responding && <ResponseForm message={message} setMessage={setMessage} priceType={priceType} setPriceType={setPriceType} priceMin={priceMin} setPriceMin={setPriceMin} priceMax={priceMax} setPriceMax={setPriceMax} availableFrom={availableFrom} setAvailableFrom={setAvailableFrom} pending={pending === "respond"} error={error} onSubmit={submitResponse} onCancel={() => setResponding(false)} />}</section>;
  if (!open) return null;
  return <section className="mt-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Interesse</p><h2 className="mt-1 text-xl font-semibold">Reageer op deze kans</h2></div>{!responding && <button type="button" onClick={() => setResponding(true)} className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-semibold text-background"><MessageSquare size={15} /> Reageren</button>}</div>{responding && <ResponseForm message={message} setMessage={setMessage} priceType={priceType} setPriceType={setPriceType} priceMin={priceMin} setPriceMin={setPriceMin} priceMax={priceMax} setPriceMax={setPriceMax} availableFrom={availableFrom} setAvailableFrom={setAvailableFrom} pending={pending === "respond"} error={error} onSubmit={submitResponse} onCancel={() => setResponding(false)} />}{!responding && (asking ? <div className="mt-4 rounded-xl border border-border bg-surface p-4"><label className="grid gap-2 text-sm font-semibold">Vraag aan de plaatser<textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={4} className="input resize-y font-normal" placeholder="Welke informatie heb je nodig om te kunnen reageren?" /></label>{error && <p className="mt-2 text-xs text-red-700" role="alert">{error}</p>}<div className="mt-3 flex gap-2"><button type="button" onClick={() => void submitQuestion()} disabled={pending === "question" || question.trim().length < 10} className="response-action bg-foreground text-background"><Send size={14} /> Versturen</button><button type="button" onClick={() => setAsking(false)} className="response-action border border-border">Annuleren</button></div></div> : <button type="button" onClick={() => setAsking(true)} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-muted underline decoration-border-strong underline-offset-4 hover:text-foreground">Eerst een vraag stellen</button>)}</section>;
}

function ResponseForm({ message, setMessage, priceType, setPriceType, priceMin, setPriceMin, priceMax, setPriceMax, availableFrom, setAvailableFrom, pending, error, onSubmit, onCancel }: { message: string; setMessage: (value: string) => void; priceType: string; setPriceType: (value: string) => void; priceMin: string; setPriceMin: (value: string) => void; priceMax: string; setPriceMax: (value: string) => void; availableFrom: string; setAvailableFrom: (value: string) => void; pending: boolean; error: string | null; onSubmit: () => Promise<void>; onCancel: () => void }) {
  return <div className="mt-4 rounded-xl border border-border bg-surface p-4 sm:p-5"><label className="grid gap-2 text-sm font-semibold">Korte toelichting<textarea value={message} onChange={(event) => setMessage(event.target.value.slice(0, 3000))} rows={6} className="input resize-y font-normal leading-6" placeholder="Waarom past jouw bedrijf bij deze kans? Noem relevante ervaring en je voorgestelde aanpak." /></label><div className="mt-4 grid gap-3 sm:grid-cols-3"><label className="grid gap-1.5 text-xs font-semibold">Prijsindicatie<select value={priceType} onChange={(event) => setPriceType(event.target.value)} className="input"><option value="">Niet opgeven</option><option value="fixed">Vaste prijs</option><option value="range">Prijsrange</option><option value="per_hour">Per uur</option><option value="per_project">Per project</option></select></label>{priceType && <label className="grid gap-1.5 text-xs font-semibold">{priceType === "range" ? "Vanaf" : "Bedrag"}<input type="number" min="0" value={priceMin} onChange={(event) => setPriceMin(event.target.value)} className="input" placeholder="€" /></label>}{priceType === "range" && <label className="grid gap-1.5 text-xs font-semibold">Tot<input type="number" min={priceMin || "0"} value={priceMax} onChange={(event) => setPriceMax(event.target.value)} className="input" placeholder="€" /></label>}<label className="grid gap-1.5 text-xs font-semibold">Beschikbaar vanaf<input type="date" value={availableFrom} onChange={(event) => setAvailableFrom(event.target.value)} className="input" /></label></div>{error && <div className="mt-3 flex gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700" role="alert"><AlertCircle size={14} />{error}</div>}<div className="mt-4 flex gap-2"><button type="button" onClick={() => void onSubmit()} disabled={pending || message.trim().length < 20} className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-brand-fg disabled:opacity-40">{pending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Verstuur reactie</button><button type="button" onClick={onCancel} className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-semibold">Annuleren</button></div></div>;
}

function Detail({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="flex gap-3 bg-surface p-4"><span className="mt-0.5 text-muted">{icon}</span><div><dt className="text-xs font-medium text-muted">{label}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div></div>; }
function Stat({ value, label }: { value: number; label: string }) { return <div><p className="text-xl font-semibold">{value}</p><p className="text-xs text-muted">{label}</p></div>; }
