"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Clock, Zap, Package, MessageSquare, Send, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/app-store";
import { CompanyAvatar } from "@/components/ui/primitives";
import { respondToOpportunity, closeOpportunity, triggerExpansionRound, askQuestion, selectResponse, withdrawResponse, updateOpportunityStatus } from "@/lib/opportunity-actions";
import type { Opportunity, OpportunityResponse, OpportunityMatch, DistributionRound } from "@/lib/types";

const URGENCY_LABELS: Record<string, string> = {
  normal: "Geen haast",
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

const STATUS_LABELS: Record<string, string> = {
  draft: "Concept",
  active: "Actief",
  matching: "Bezig met matchen",
  responses_received: "Reacties ontvangen",
  in_conversation: "In gesprek",
  party_selected: "Partij gekozen",
  preparing_deal: "Deal in voorbereiding",
  completed: "Afgerond",
  cancelled: "Geannuleerd",
  expired: "Verlopen",
};

export function OpportunityDetailClient({
  opportunity,
  responses,
  categoryPath,
  isOwner,
  myCompanyId,
  matches = [],
  rounds = [],
}: {
  opportunity: Opportunity;
  responses: OpportunityResponse[];
  categoryPath: string;
  isOwner: boolean;
  myCompanyId: string;
  matches?: OpportunityMatch[];
  rounds?: DistributionRound[];
}) {
  const router = useRouter();
  const { companyById, toast } = useApp();
  const [showRespond, setShowRespond] = useState(false);
  const [message, setMessage] = useState("");
  const [priceType, setPriceType] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [question, setQuestion] = useState("");

  const company = companyById(opportunity.companyId);
  const myResponse = responses.find((r) => r.respondingCompanyId === myCompanyId);

  const handleRespond = async () => {
    if (!message.trim()) {
      setError("Bericht is verplicht.");
      return;
    }
    setSending(true);
    setError(null);
    const result = await respondToOpportunity(opportunity.id, {
      message: message.trim(),
      priceType: priceType || undefined,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      availableFrom: availableFrom || undefined,
    });
    setSending(false);
    if (result.ok) {
      toast("Reactie verzonden!", "De aanvrager ontvangt je bericht.");
      setShowRespond(false);
      setMessage("");
      router.refresh();
    } else {
      setError(result.error ?? "Er ging iets mis.");
    }
  };

  const handleClose = async (outcome: "via_vynta" | "outside_vynta" | "not_yet" | "cancel") => {
    setClosing(true);
    const result = await closeOpportunity(opportunity.id, outcome);
    setClosing(false);
    if (result.ok) {
      toast(outcome === "cancel" ? "Aanvraag geannuleerd" : "Aanvraag afgesloten", "");
      router.refresh();
    } else {
      toast("Fout", result.error ?? "Er ging iets mis.");
    }
  };

  const handleExpand = async () => {
    setExpanding(true);
    const result = await triggerExpansionRound(opportunity.id);
    setExpanding(false);
    if (result.ok) {
      toast("Expansieronde gestart", `${result.matched ?? 0} nieuwe bedrijven gevonden.`);
      router.refresh();
    } else {
      toast("Fout", result.error ?? "Er ging iets mis.");
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    const result = await askQuestion(opportunity.id, question.trim());
    if (result.ok) {
      toast("Vraag verzonden", "");
      setShowQuestion(false);
      setQuestion("");
      router.refresh();
    } else {
      toast("Fout", result.error ?? "Er ging iets mis.");
    }
  };

  const handleSelectResponse = async (responseId: string) => {
    const result = await selectResponse(opportunity.id, responseId);
    if (result.ok) {
      toast("Partij gekozen", "De aanvraag is gemarkeerd als in behandeling.");
      router.refresh();
    } else {
      toast("Fout", result.error ?? "Er ging iets mis.");
    }
  };

  const handleWithdraw = async () => {
    const result = await withdrawResponse(opportunity.id);
    if (result.ok) {
      toast("Reactie ingetrokken", "");
      router.refresh();
    } else {
      toast("Fout", result.error ?? "Er ging iets mis.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Back */}
      <button
        onClick={() => router.push("/opportunities")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> Terug naar kansen
      </button>

      {/* Company header */}
      <div className="mb-5 flex items-center gap-3">
        <CompanyAvatar
          name={company?.name ?? "Onbekend"}
          color={company?.logoColor ?? "#6d28d9"}
          logoUrl={company?.logoUrl}
          size={44}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{company?.name ?? "Onbekend bedrijf"}</p>
          <p className="truncate text-xs text-muted">
            {company?.verified && "✓ Geverifieerd · "}
            {new Date(opportunity.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <span className={cn(
          "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
          opportunity.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-500" : "bg-surface-2 text-muted"
        )}>
          {STATUS_LABELS[opportunity.status] ?? opportunity.status}
        </span>
      </div>

      {/* Title + description */}
      <h1 className="mb-2 text-xl font-bold leading-snug">{opportunity.title}</h1>
      {opportunity.description && (
        <p className="mb-4 text-[15px] leading-relaxed text-muted">{opportunity.description}</p>
      )}

      {/* Meta chips */}
      <div className="mb-5 flex flex-wrap gap-2">
        {categoryPath && (
          <MetaChip icon={<Package size={13} />} label={categoryPath} />
        )}
        {opportunity.municipality && (
          <MetaChip icon={<MapPin size={13} />} label={opportunity.municipality} />
        )}
        <MetaChip icon={<Zap size={13} />} label={URGENCY_LABELS[opportunity.urgency]} className={URGENCY_COLORS[opportunity.urgency]} />
        {opportunity.quantity && (
          <MetaChip icon={<Package size={13} />} label={`${opportunity.quantity}${opportunity.unit ? ` ${opportunity.unit}` : ""}`} />
        )}
        {opportunity.startDate && (
          <MetaChip icon={<Clock size={13} />} label={`Start ${new Date(opportunity.startDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}`} />
        )}
        <MetaChip icon={<Zap size={13} />} label={BUDGET_LABELS[opportunity.budgetType]} />
        {opportunity.budgetMin != null && (
          <MetaChip icon={<Zap size={13} />} label={`€${opportunity.budgetMin}${opportunity.budgetMax != null ? `–${opportunity.budgetMax}` : ""}`} />
        )}
      </div>

      {/* Owner: responses section */}
      {isOwner && responses.length > 0 && (
        <div className="mb-5">
          <h2 className="mb-3 text-sm font-bold">{responses.length} reactie{responses.length > 1 ? "s" : ""}</h2>
          <div className="space-y-2">
            {responses.map((resp) => {
              const respCompany = companyById(resp.respondingCompanyId);
              return (
                <div key={resp.id} className="rounded-xl border border-border bg-surface p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <CompanyAvatar
                      name={respCompany?.name ?? "?"}
                      color={respCompany?.logoColor ?? "#6d28d9"}
                      logoUrl={respCompany?.logoUrl}
                      size={28}
                    />
                    <span className="text-sm font-semibold">{respCompany?.name ?? "Onbekend"}</span>
                    <span className="ml-auto text-xs text-muted">
                      {new Date(resp.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="text-sm text-muted">{resp.message}</p>
                  {resp.priceMin != null && (
                    <p className="mt-1.5 text-xs font-medium">
                      Prijs: €{resp.priceMin}{resp.priceMax != null ? `–${resp.priceMax}` : ""} {resp.priceType}
                    </p>
                  )}
                  {resp.status === "selected" && (
                    <span className="mt-2 inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-950/30 dark:text-green-500">
                      ✓ Geselecteerd
                    </span>
                  )}
                  {resp.status === "question" && (
                    <span className="mt-2 inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-500">
                      Vraag
                    </span>
                  )}
                  {(opportunity.status === "active" || opportunity.status === "matching" || opportunity.status === "responses_received") && resp.status !== "selected" && resp.status !== "question" && (
                    <button
                      onClick={() => handleSelectResponse(resp.id)}
                      className="mt-2 rounded-full border border-border px-3 py-1 text-xs font-semibold transition-colors hover:bg-surface-2"
                    >
                      Selecteer als partij
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Close actions */}
          {opportunity.status === "active" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => handleClose("via_vynta")}
                disabled={closing}
                className="rounded-full bg-green-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700"
              >
                <Check size={12} className="mr-1 inline" /> Oplossing via Vynta
              </button>
              <button
                onClick={() => handleClose("outside_vynta")}
                disabled={closing}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold transition-colors hover:bg-surface-2"
              >
                Buiten Vynta opgelost
              </button>
              <button
                onClick={() => handleClose("cancel")}
                disabled={closing}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-2"
              >
                Annuleren
              </button>
            </div>
          )}
        </div>
      )}

      {/* Owner: matches overview */}
      {isOwner && (opportunity.status === "active" || opportunity.status === "matching") && (
        <div className="mb-5 rounded-2xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">Matching</h2>
            {rounds.length > 0 && (
              <span className="text-xs text-muted">
                {rounds.length} ronde{rounds.length > 1 ? "s" : ""} · {matches.length} match{matches.length !== 1 ? "es" : ""}
              </span>
            )}
          </div>

          {matches.length === 0 ? (
            <p className="text-sm text-muted">
              {rounds.length === 0
                ? "Matching is gestart. Het kan even duren voordat matches verschijnen."
                : "Nog geen matches gevonden. Probeer een expansieronde."}
            </p>
          ) : (
            <>
              <div className="mb-3 space-y-1.5">
                {matches.slice(0, 5).map((m) => {
                  const matchCompany = companyById(m.companyId);
                  return (
                    <div key={m.id} className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2">
                      <CompanyAvatar
                        name={matchCompany?.name ?? "?"}
                        color={matchCompany?.logoColor ?? "#6d28d9"}
                        logoUrl={matchCompany?.logoUrl}
                        size={24}
                      />
                      <span className="flex-1 truncate text-xs font-medium">{matchCompany?.name ?? "Onbekend"}</span>
                      <span className={cn(
                        "text-xs font-bold",
                        m.totalScore >= 70 ? "text-green-600 dark:text-green-500" : m.totalScore >= 50 ? "text-yellow-600 dark:text-yellow-500" : "text-muted"
                      )}>
                        {m.totalScore}%
                      </span>
                      <span className="text-[10px] text-muted">{m.status}</span>
                    </div>
                  );
                })}
                {matches.length > 5 && (
                  <p className="text-xs text-muted">+{matches.length - 5} meer</p>
                )}
              </div>
              {matches[0].reasons.length > 0 && (
                <div className="mb-3 rounded-lg bg-surface-2 p-2">
                  <p className="text-[10px] font-semibold uppercase text-muted">Top redenen</p>
                  <p className="text-xs text-muted">{matches[0].reasons.join(" · ")}</p>
                </div>
              )}
            </>
          )}

          {/* Expansion round button */}
          {opportunity.status === "active" || opportunity.status === "matching" ? (
            <button
              onClick={handleExpand}
              disabled={expanding}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-surface-2 disabled:opacity-50"
            >
              {expanding ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
              {expanding ? "Bezig..." : "Expansieronde starten"}
            </button>
          ) : null}
        </div>
      )}

      {/* Non-owner: respond section */}
      {!isOwner && opportunity.status === "active" && (
        <div className="mt-6 space-y-3">
          {myResponse ? (
            <div className="rounded-2xl border border-green-300/50 bg-green-50 p-4 dark:border-green-700/30 dark:bg-green-950/20">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-500">
                <Check size={16} /> Je hebt gereageerd
              </div>
              <p className="mt-1.5 text-sm text-muted">{myResponse.message}</p>
              <button
                onClick={handleWithdraw}
                className="mt-2 text-xs font-medium text-muted underline hover:text-foreground"
              >
                Reactie intrekken
              </button>
            </div>
          ) : showRespond ? (
            <RespondForm
              message={message}
              setMessage={setMessage}
              priceType={priceType}
              setPriceType={setPriceType}
              priceMin={priceMin}
              setPriceMin={setPriceMin}
              priceMax={priceMax}
              setPriceMax={setPriceMax}
              availableFrom={availableFrom}
              setAvailableFrom={setAvailableFrom}
              onSend={handleRespond}
              onCancel={() => { setShowRespond(false); setError(null); }}
              sending={sending}
              error={error}
            />
          ) : (
            <>
              <button
                onClick={() => setShowRespond(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                <MessageSquare size={18} /> Reageer op deze aanvraag
              </button>
              {showQuestion ? (
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <label className="mb-1.5 block text-sm font-semibold">Stel een vraag</label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Wat wil je weten voordat je reageert?"
                    rows={3}
                    className="mb-3 w-full resize-none rounded-xl border border-border bg-surface p-3 text-sm outline-none focus:border-foreground/30"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAskQuestion}
                      disabled={!question.trim()}
                      className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-50"
                    >
                      Verstuur vraag
                    </button>
                    <button
                      onClick={() => { setShowQuestion(false); setQuestion(""); }}
                      className="rounded-full border border-border px-4 py-2 text-xs font-semibold"
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowQuestion(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-semibold transition-colors hover:bg-surface-2"
                >
                  Vraag stellen
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Non-owner, not active */}
      {!isOwner && opportunity.status !== "active" && (
        <div className="mt-6 rounded-2xl border border-border bg-surface-2 p-4 text-center text-sm text-muted">
          Deze aanvraag is niet meer actief.
        </div>
      )}
    </div>
  );
}

function MetaChip({ icon, label, className }: { icon: React.ReactNode; label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium", className)}>
      {icon} {label}
    </span>
  );
}

function RespondForm({
  message,
  setMessage,
  priceType,
  setPriceType,
  priceMin,
  setPriceMin,
  priceMax,
  setPriceMax,
  availableFrom,
  setAvailableFrom,
  onSend,
  onCancel,
  sending,
  error,
}: {
  message: string;
  setMessage: (v: string) => void;
  priceType: string;
  setPriceType: (v: string) => void;
  priceMin: string;
  setPriceMin: (v: string) => void;
  priceMax: string;
  setPriceMax: (v: string) => void;
  availableFrom: string;
  setAvailableFrom: (v: string) => void;
  onSend: () => void;
  onCancel: () => void;
  sending: boolean;
  error: string | null;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-bold">Reageer op deze aanvraag</h3>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Vertel kort waarom jij de juiste partij bent..."
        rows={4}
        className="mb-3 w-full resize-none rounded-xl border border-border bg-surface p-3 text-sm outline-none transition-colors focus:border-foreground/30"
        autoFocus
      />

      {/* Optional price */}
      <div className="mb-3 flex flex-wrap gap-2">
        <select
          value={priceType}
          onChange={(e) => setPriceType(e.target.value)}
          className="rounded-lg border border-border bg-surface px-2 py-2 text-sm outline-none"
        >
          <option value="">Geen prijsopgave</option>
          <option value="fixed">Vaste prijs</option>
          <option value="range">Prijsrange</option>
          <option value="per_hour">Per uur</option>
          <option value="per_project">Per project</option>
        </select>
        {priceType && (
          <>
            <input
              type="number"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder="Min €"
              className="w-24 rounded-lg border border-border bg-surface px-2 py-2 text-sm outline-none"
            />
            {priceType === "range" && (
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="Max €"
                className="w-24 rounded-lg border border-border bg-surface px-2 py-2 text-sm outline-none"
              />
            )}
          </>
        )}
        <input
          type="date"
          value={availableFrom}
          onChange={(e) => setAvailableFrom(e.target.value)}
          className="rounded-lg border border-border bg-surface px-2 py-2 text-sm outline-none"
          title="Beschikbaar vanaf"
        />
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-300/50 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-700/30 dark:bg-red-950/20 dark:text-red-400">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onSend}
          disabled={sending || !message.trim()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-foreground py-2.5 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {sending ? "Verzenden..." : "Verstuur reactie"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-full border border-border px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-surface-2"
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}
