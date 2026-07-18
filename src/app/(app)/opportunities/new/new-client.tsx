"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, MapPin, Clock, Package, Zap, ChevronDown, ChevronUp, Check, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/app-store";
import { createOpportunity, saveOpportunityDraft } from "@/lib/opportunity-actions";
import { extractFromText, getCategoryPath, formatSummary, type ExtractedData } from "@/lib/opportunity-extract";
import type { ServiceCategory } from "@/lib/types";

const EXAMPLES = [
  "We zoeken 3 magazijnmedewerkers voor 6 maanden in Utrecht, start volgende week",
  "50.000 golfkartonnen dozen (400×300×300mm), dubbelwandig FSC, terugkerende maandorder, levering in Utrecht",
  "Spoed: daklekkage repareren in Rotterdam, zo snel mogelijk",
  "Catering voor 200 personen op 15 maart in Amsterdam, lunch en diner",
  "Op zoek naar een CNC-verspaning partner voor 5000 aluminium onderdelen, Eindhoven",
];

type Step = "describe" | "review" | "published";

export function NewOpportunityClient({ categories }: { categories: ServiceCategory[] }) {
  const router = useRouter();
  const { toast } = useApp();
  const [step, setStep] = useState<Step>("describe");
  const [text, setText] = useState("");
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [followupAnswers, setFollowupAnswers] = useState<Record<string, string>>({});
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Advanced fields
  const [advBudgetMin, setAdvBudgetMin] = useState("");
  const [advBudgetMax, setAdvBudgetMax] = useState("");
  const [advBudgetType, setAdvBudgetType] = useState("open");
  const [advUrgency, setAdvUrgency] = useState("normal");
  const [advResponseDeadline, setAdvResponseDeadline] = useState("");
  const [advRecurrence, setAdvRecurrence] = useState("one_time");
  const [advVisibility, setAdvVisibility] = useState("matched_only");

  // Auto-save draft
  const saveDraft = useCallback(() => {
    if (!text.trim()) return;
    const data = { text, followupAnswers, advanced: { advBudgetMin, advBudgetMax, advBudgetType, advUrgency, advResponseDeadline, advRecurrence, advVisibility } };
    saveOpportunityDraft(draftId, data).then((res) => {
      if (res.ok && res.id) setDraftId(res.id);
    }).catch(() => {});
  }, [text, followupAnswers, draftId, advBudgetMin, advBudgetMax, advBudgetType, advUrgency, advResponseDeadline, advRecurrence, advVisibility]);

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(saveDraft, 2000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [text, followupAnswers, saveDraft]);

  const handleAnalyze = () => {
    if (!text.trim()) return;
    const data = extractFromText(text, categories);
    setExtracted(data);
    setStep("review");
  };

  const handleExample = (example: string) => {
    setText(example);
  };

  const handlePublish = async () => {
    if (!extracted) return;
    setPublishing(true);
    setError(null);

    const input: Parameters<typeof createOpportunity>[0] = {
      title: extracted.title,
      description: text.trim(),
      categoryId: extracted.categoryId,
      opportunityType: extracted.opportunityType,
      urgency: advUrgency !== "normal" ? advUrgency : (extracted.opportunityType === "urgent" ? "week" : "normal"),
      budgetType: advBudgetType !== "open" ? advBudgetType : (extracted.budgetType ?? "open"),
      budgetMin: advBudgetMin ? Number(advBudgetMin) : undefined,
      budgetMax: advBudgetMax ? Number(advBudgetMax) : undefined,
      quantity: extracted.quantity,
      unit: extracted.unit,
      locationType: "on_site",
      municipality: extracted.municipality,
      responseDeadline: advResponseDeadline || undefined,
      recurrenceType: advRecurrence,
      visibilityMode: advVisibility,
    };

    const result = await createOpportunity(input);
    setPublishing(false);

    if (result.ok && result.id) {
      setCreatedId(result.id);
      setStep("published");
      if (draftId) {
        // Draft will be cleaned up later
      }
    } else {
      setError(result.error ?? "Er ging iets mis. Probeer het opnieuw.");
    }
  };

  if (step === "published") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-green-100 dark:bg-green-950/30">
            <Check size={32} className="text-green-600 dark:text-green-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Aanvraag geplaatst!</h1>
          <p className="mt-2 text-sm text-muted">
            We zoeken nu bedrijven die bij jouw aanvraag passen. Je ontvangt een melding zodra er reacties zijn.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={() => router.push(`/opportunities/${createdId}`)}
              className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Bekijk aanvraag
            </button>
            <button
              onClick={() => router.push("/opportunities")}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-2"
            >
              Naar overzicht
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "review" && extracted) {
    return (
      <ReviewStep
        extracted={extracted}
        categories={categories}
        text={text}
        onBack={() => setStep("describe")}
        onPublish={handlePublish}
        publishing={publishing}
        error={error}
        followupAnswers={followupAnswers}
        setFollowupAnswers={setFollowupAnswers}
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
        advBudgetMin={advBudgetMin}
        setAdvBudgetMin={setAdvBudgetMin}
        advBudgetMax={advBudgetMax}
        setAdvBudgetMax={setAdvBudgetMax}
        advBudgetType={advBudgetType}
        setAdvBudgetType={setAdvBudgetType}
        advUrgency={advUrgency}
        setAdvUrgency={setAdvUrgency}
        advResponseDeadline={advResponseDeadline}
        setAdvResponseDeadline={setAdvResponseDeadline}
        advRecurrence={advRecurrence}
        setAdvRecurrence={setAdvRecurrence}
        advVisibility={advVisibility}
        setAdvVisibility={setAdvVisibility}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Back */}
      <button
        onClick={() => router.push("/opportunities")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> Terug naar kansen
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Wat zoek je?</h1>
        <p className="mt-1.5 text-sm text-muted">
          Beschrijf in één of twee zinnen wat je nodig hebt. Wij halen de details eruit.
        </p>
      </div>

      {/* Text input */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Bijv: We zoeken 3 magazijnmedewerkers voor 6 maanden in Utrecht, start volgende week"
          rows={5}
          className="w-full resize-none rounded-2xl border border-border bg-surface p-4 text-[15px] leading-relaxed outline-none transition-colors placeholder:text-muted/60 focus:border-foreground/30"
          autoFocus
        />
        {text.length > 0 && (
          <button
            onClick={handleAnalyze}
            disabled={!text.trim()}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Sparkles size={14} /> Analyseer
          </button>
        )}
      </div>

      {/* Examples */}
      {!text && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Of probeer een voorbeeld:</p>
          <div className="flex flex-col gap-1.5">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => handleExample(ex)}
                className="rounded-xl border border-border bg-surface p-3 text-left text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Draft indicator */}
      {draftId && text && (
        <p className="mt-3 text-xs text-muted">
          <Check size={12} className="mr-1 inline" /> Concept automatisch opgeslagen
        </p>
      )}
    </div>
  );
}

/* ────────────────── Review Step ────────────────── */

function ReviewStep({
  extracted,
  categories,
  text,
  onBack,
  onPublish,
  publishing,
  error,
  followupAnswers,
  setFollowupAnswers,
  showAdvanced,
  setShowAdvanced,
  advBudgetMin,
  setAdvBudgetMin,
  advBudgetMax,
  setAdvBudgetMax,
  advBudgetType,
  setAdvBudgetType,
  advUrgency,
  setAdvUrgency,
  advResponseDeadline,
  setAdvResponseDeadline,
  advRecurrence,
  setAdvRecurrence,
  advVisibility,
  setAdvVisibility,
}: {
  extracted: ExtractedData;
  categories: ServiceCategory[];
  text: string;
  onBack: () => void;
  onPublish: () => void;
  publishing: boolean;
  error: string | null;
  followupAnswers: Record<string, string>;
  setFollowupAnswers: (v: Record<string, string>) => void;
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  advBudgetMin: string;
  setAdvBudgetMin: (v: string) => void;
  advBudgetMax: string;
  setAdvBudgetMax: (v: string) => void;
  advBudgetType: string;
  setAdvBudgetType: (v: string) => void;
  advUrgency: string;
  setAdvUrgency: (v: string) => void;
  advResponseDeadline: string;
  setAdvResponseDeadline: (v: string) => void;
  advRecurrence: string;
  setAdvRecurrence: (v: string) => void;
  advVisibility: string;
  setAdvVisibility: (v: string) => void;
}) {
  const summary = formatSummary(extracted, categories);
  const categoryPath = extracted.categoryId ? getCategoryPath(extracted.categoryId, categories) : null;

  // Determine which follow-up questions to ask
  const questions: { key: string; label: string; type: "text" | "select" | "date"; options?: { value: string; label: string }[] }[] = [];

  if (!extracted.municipality) {
    questions.push({ key: "municipality", label: "Waar is dit nodig?", type: "text" });
  }
  if (!extracted.startDate) {
    questions.push({
      key: "urgency",
      label: "Hoe snel heb je dit nodig?",
      type: "select",
      options: [
        { value: "urgent_today", label: "Vandaag / spoed" },
        { value: "hours_48", label: "Binnen 48 uur" },
        { value: "week", label: "Binnen een week" },
        { value: "normal", label: "Geen haast" },
      ],
    });
  }
  if (!extracted.budgetType) {
    questions.push({
      key: "budget",
      label: "Heb je een budget in gedachten?",
      type: "select",
      options: [
        { value: "open", label: "Budget in overleg" },
        { value: "fixed", label: "Ik heb een vast budget" },
        { value: "range", label: "Ik heb een range" },
        { value: "per_hour", label: "Per uur" },
        { value: "per_project", label: "Per project" },
      ],
    });
  }

  // Only show max 3 questions
  const visibleQuestions = questions.slice(0, 3);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Back */}
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> Pas tekst aan
      </button>

      {/* Header */}
      <div className="mb-5">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1 text-xs font-semibold">
          <Sparkles size={12} /> Wij hebben dit herkend
        </div>
        <h1 className="text-xl font-bold leading-snug">{extracted.title}</h1>
      </div>

      {/* Extracted summary */}
      <div className="mb-5 rounded-2xl border border-border bg-surface p-4">
        <div className="flex flex-wrap gap-2">
          {categoryPath && (
            <SummaryChip icon={<Package size={13} />} label={categoryPath} />
          )}
          {extracted.municipality && (
            <SummaryChip icon={<MapPin size={13} />} label={extracted.municipality} />
          )}
          {extracted.startDate && (
            <SummaryChip icon={<Clock size={13} />} label={`Start ${extracted.startDate.toLowerCase()}`} />
          )}
          {extracted.duration && (
            <SummaryChip icon={<Clock size={13} />} label={extracted.duration} />
          )}
          {extracted.quantity && extracted.unit && (
            <SummaryChip icon={<Package size={13} />} label={`${extracted.quantity} ${extracted.unit}`} />
          )}
          {extracted.budgetType && extracted.budgetType !== "open" && (
            <SummaryChip icon={<Zap size={13} />} label={extracted.budgetType === "fixed" ? "Vast budget" : "Budget bekend"} />
          )}
        </div>
        {extracted.keywords.length > 0 && (
          <p className="mt-3 text-xs text-muted">
            <span className="font-semibold">Trefwoorden:</span> {extracted.keywords.join(", ")}
          </p>
        )}
      </div>

      {/* Follow-up questions */}
      {visibleQuestions.length > 0 && (
        <div className="mb-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Nog {visibleQuestions.length} vraag{visibleQuestions.length > 1 ? "en" : ""}</p>
          {visibleQuestions.map((q) => (
            <div key={q.key}>
              <label className="mb-1.5 block text-sm font-medium">{q.label}</label>
              {q.type === "select" && q.options ? (
                <div className="flex flex-wrap gap-1.5">
                  {q.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFollowupAnswers({ ...followupAnswers, [q.key]: opt.value })}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                        followupAnswers[q.key] === opt.value
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted hover:bg-surface-2"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type={q.type === "date" ? "date" : "text"}
                  value={followupAnswers[q.key] ?? ""}
                  onChange={(e) => setFollowupAnswers({ ...followupAnswers, [q.key]: e.target.value })}
                  placeholder="Bijv. Utrecht"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-foreground/30"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Advanced options */}
      <div className="mb-5">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold transition-colors hover:bg-surface-2"
        >
          <span>Meer opties</span>
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showAdvanced && (
          <div className="mt-2 space-y-3 rounded-xl border border-border bg-surface p-4">
            {/* Budget */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Budget</label>
              <div className="flex gap-2">
                <select
                  value={advBudgetType}
                  onChange={(e) => setAdvBudgetType(e.target.value)}
                  className="rounded-lg border border-border bg-surface px-2 py-2 text-sm outline-none"
                >
                  <option value="open">In overleg</option>
                  <option value="fixed">Vast</option>
                  <option value="range">Range</option>
                  <option value="per_hour">Per uur</option>
                  <option value="per_unit">Per stuk</option>
                  <option value="per_project">Per project</option>
                </select>
                {advBudgetType !== "open" && advBudgetType !== "discuss" && (
                  <>
                    <input
                      type="number"
                      value={advBudgetMin}
                      onChange={(e) => setAdvBudgetMin(e.target.value)}
                      placeholder="Min €"
                      className="w-24 rounded-lg border border-border bg-surface px-2 py-2 text-sm outline-none"
                    />
                    {advBudgetType === "range" && (
                      <input
                        type="number"
                        value={advBudgetMax}
                        onChange={(e) => setAdvBudgetMax(e.target.value)}
                        placeholder="Max €"
                        className="w-24 rounded-lg border border-border bg-surface px-2 py-2 text-sm outline-none"
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Urgentie</label>
              <select
                value={advUrgency}
                onChange={(e) => setAdvUrgency(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none"
              >
                <option value="normal">Geen haast</option>
                <option value="week">Binnen een week</option>
                <option value="hours_48">Binnen 48 uur</option>
                <option value="urgent_today">Spoed vandaag</option>
              </select>
            </div>

            {/* Response deadline */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Reactie deadline</label>
              <input
                type="date"
                value={advResponseDeadline}
                onChange={(e) => setAdvResponseDeadline(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none"
              />
            </div>

            {/* Recurrence */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Herhalend</label>
              <select
                value={advRecurrence}
                onChange={(e) => setAdvRecurrence(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none"
              >
                <option value="one_time">Eenmalig</option>
                <option value="recurring">Terugkerend</option>
              </select>
            </div>

            {/* Visibility */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Zichtbaarheid</label>
              <select
                value={advVisibility}
                onChange={(e) => setAdvVisibility(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none"
              >
                <option value="matched_only">Alleen voor gematchte bedrijven</option>
                <option value="public">Openbaar</option>
                <option value="after_interest">Na interesse</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-300/50 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-950/20 dark:text-red-400">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {/* Publish */}
      <button
        onClick={onPublish}
        disabled={publishing}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {publishing ? (
          <><Loader2 size={18} className="animate-spin" /> Aanvraag wordt geplaatst...</>
        ) : (
          <>Plaats aanvraag</>
        )}
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        Vynta zoekt automatisch passende bedrijven. Je ontvangt reacties in je inbox.
      </p>
    </div>
  );
}

function SummaryChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1.5 text-xs font-medium">
      {icon} {label}
    </span>
  );
}
