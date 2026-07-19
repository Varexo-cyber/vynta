"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Bookmark, Check, Eye, Loader2, MapPin, Save } from "lucide-react";
import { createOpportunity, deleteOpportunityDraft, saveOpportunityDraft, updateOpportunity, type OpportunityInput } from "@/lib/opportunity-actions";
import { useApp } from "@/components/app-store";
import type { Opportunity, OpportunityDraft, ServiceCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

type FormState = Required<Pick<OpportunityInput, "title" | "description" | "categoryId" | "opportunityType" | "urgency" | "budgetType" | "quantity" | "unit" | "locationType" | "municipality" | "province" | "startDate" | "endDate" | "responseDeadline" | "recurrenceType" | "visibilityMode">> & {
  budgetMin: string;
  budgetMax: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  categoryId: "",
  opportunityType: "request",
  urgency: "normal",
  budgetType: "open",
  budgetMin: "",
  budgetMax: "",
  quantity: "",
  unit: "",
  locationType: "on_site",
  municipality: "",
  province: "",
  startDate: "",
  endDate: "",
  responseDeadline: "",
  recurrenceType: "one_time",
  visibilityMode: "public",
};

function opportunityToForm(opportunity: Opportunity): FormState {
  return {
    title: opportunity.title,
    description: opportunity.description ?? "",
    categoryId: opportunity.categoryId ?? "",
    opportunityType: opportunity.opportunityType,
    urgency: opportunity.urgency,
    budgetType: opportunity.budgetType,
    budgetMin: opportunity.budgetMin?.toString() ?? "",
    budgetMax: opportunity.budgetMax?.toString() ?? "",
    quantity: opportunity.quantity ?? "",
    unit: opportunity.unit ?? "",
    locationType: opportunity.locationType,
    municipality: opportunity.municipality ?? "",
    province: opportunity.province ?? "",
    startDate: opportunity.startDate?.slice(0, 10) ?? "",
    endDate: opportunity.endDate?.slice(0, 10) ?? "",
    responseDeadline: opportunity.responseDeadline?.slice(0, 10) ?? "",
    recurrenceType: opportunity.recurrenceType,
    visibilityMode: opportunity.visibilityMode,
  };
}

function draftToForm(draft?: OpportunityDraft | null): FormState {
  if (!draft) return EMPTY_FORM;
  const data = draft.data as Partial<FormState> & { text?: string };
  if (data.text && !data.description) {
    return { ...EMPTY_FORM, ...data, title: data.title || data.text.slice(0, 120), description: data.text };
  }
  return { ...EMPTY_FORM, ...data };
}

export function NewOpportunityClient({ categories, initialDraft }: { categories: ServiceCategory[]; initialDraft?: OpportunityDraft | null }) {
  return <OpportunityEditor categories={categories} initial={draftToForm(initialDraft)} initialDraftId={initialDraft?.id ?? null} />;
}

export function EditOpportunityClient({ categories, opportunity }: { categories: ServiceCategory[]; opportunity: Opportunity }) {
  return <OpportunityEditor categories={categories} initial={opportunityToForm(opportunity)} opportunityId={opportunity.id} />;
}

function OpportunityEditor({ categories, initial, initialDraftId = null, opportunityId }: { categories: ServiceCategory[]; initial: FormState; initialDraftId?: string | null; opportunityId?: string }) {
  const router = useRouter();
  const { toast } = useApp();
  const [form, setForm] = useState<FormState>(initial);
  const [draftId, setDraftId] = useState(initialDraftId);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(initialDraftId ? new Date().toISOString() : null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(false);
  const saveInFlight = useRef(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const hasContent = form.title.trim().length > 0 || form.description.trim().length > 0;

  const saveDraft = async (silent = false) => {
    if (opportunityId || !hasContent || saveInFlight.current) return;
    saveInFlight.current = true;
    setSaving(true);
    try {
      const result = await saveOpportunityDraft(draftId, form as unknown as Record<string, unknown>);
      if (result.ok && result.id) {
        setDraftId(result.id);
        setSavedAt(new Date().toISOString());
        if (!silent) toast("Concept opgeslagen", "Je kunt later verdergaan via Mijn kansen.");
      } else if (!silent) {
        toast("Opslaan mislukt", result.error ?? "Probeer het opnieuw.");
      }
    } catch {
      if (!silent) toast("Opslaan mislukt", "Controleer je verbinding en probeer het opnieuw.");
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!hasContent || opportunityId) return;
    const timer = window.setTimeout(() => void saveDraft(true), 1200);
    return () => window.clearTimeout(timer);
    // Autosave follows the current form value; draftId is intentionally captured.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, hasContent, opportunityId]);

  const input = useMemo<OpportunityInput>(() => ({
    title: form.title,
    description: form.description,
    categoryId: form.categoryId || undefined,
    opportunityType: form.opportunityType,
    urgency: form.urgency,
    budgetType: form.budgetType,
    budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
    budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
    quantity: form.quantity || undefined,
    unit: form.unit || undefined,
    locationType: form.locationType,
    municipality: form.locationType === "remote" ? undefined : form.municipality || undefined,
    province: form.locationType === "remote" ? undefined : form.province || undefined,
    startDate: form.startDate || undefined,
    endDate: form.endDate || undefined,
    responseDeadline: form.responseDeadline || undefined,
    recurrenceType: form.recurrenceType,
    visibilityMode: form.visibilityMode,
  }), [form]);

  const submit = async () => {
    setPublishing(true);
    setError(null);
    try {
      const result = opportunityId ? await updateOpportunity(opportunityId, input) : await createOpportunity(input);
      if (!result.ok) return setError(result.error ?? "De kans kon niet worden opgeslagen.");
      const id = opportunityId || ("id" in result ? result.id : undefined);
      if (draftId && !opportunityId) await deleteOpportunityDraft(draftId);
      toast(opportunityId ? "Kans bijgewerkt" : "Kans gepubliceerd", opportunityId ? "Je wijzigingen zijn direct zichtbaar." : "Bedrijven kunnen deze kans nu vinden en erop reageren.");
      router.push(id ? `/opportunities/${id}` : "/opportunities?tab=mine");
      router.refresh();
    } catch {
      setError("De verbinding werd onderbroken. Je invoer staat nog klaar; probeer het opnieuw.");
    } finally {
      setPublishing(false);
    }
  };

  const topCategories = categories.filter((category) => category.level <= 1);
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-9 xl:px-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <Link href={opportunityId ? `/opportunities/${opportunityId}` : "/opportunities"} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground focus-ring"><ArrowLeft size={16} /> Terug</Link>
        <div className="flex items-center gap-2">
          {!opportunityId && <button type="button" onClick={() => void saveDraft()} disabled={!hasContent || saving} className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-surface disabled:opacity-40"><Save size={15} /> {saving ? "Opslaan…" : "Bewaar concept"}</button>}
          <button type="button" onClick={() => setPreview((value) => !value)} className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-surface"><Eye size={15} /> {preview ? "Bewerken" : "Voorbeeld"}</button>
        </div>
      </div>

      <header className="mb-8 max-w-2xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand">{opportunityId ? "Kans beheren" : "Nieuwe kans"}</p>
        <h1 className="text-3xl font-semibold tracking-[-0.045em]">{opportunityId ? "Kans bewerken" : "Vertel helder wat je zoekt of aanbiedt"}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Concrete informatie levert betere reacties op. Contactgegevens blijven buiten de openbare beschrijving.</p>
      </header>

      {preview ? <OpportunityPreview form={form} categories={categories} /> : (
        <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-8">
            <FormSection number="01" title="De kern" description="Wat voor zakelijke kans plaats je?">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Type kans" required><select value={form.opportunityType} onChange={(event) => setField("opportunityType", event.target.value)} className="input"><option value="request">Opdracht of vraag</option><option value="sourcing">Leverancier gezocht</option><option value="job">Personeel gezocht</option><option value="partnership">Samenwerking</option><option value="capacity">Capaciteit beschikbaar/gezocht</option><option value="offer">Zakelijk aanbod</option><option value="urgent">Spoedvraag</option></select></Field>
                <Field label="Sector" required><select value={form.categoryId} onChange={(event) => setField("categoryId", event.target.value)} className="input" required><option value="">Kies een sector</option>{topCategories.map((category) => <option key={category.id} value={category.id}>{category.level === 1 ? `— ${category.name}` : category.name}</option>)}</select></Field>
              </div>
              <Field label="Titel" hint={`${form.title.length}/120`} required><input value={form.title} onChange={(event) => setField("title", event.target.value.slice(0, 120))} placeholder="Bijv. Logistieke partner gezocht voor wekelijkse distributie" className="input" required minLength={8} /></Field>
              <Field label="Beschrijving" hint="Omschrijf de opdracht, gewenste uitkomst en belangrijke voorwaarden." required><textarea value={form.description} onChange={(event) => setField("description", event.target.value.slice(0, 5000))} rows={8} placeholder="Wat moet een bedrijf weten om te beoordelen of dit past?" className="input resize-y leading-6" required minLength={30} /></Field>
            </FormSection>

            <FormSection number="02" title="Omvang en locatie" description="Maak de praktische scope direct duidelijk.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Aantal / omvang"><input value={form.quantity} onChange={(event) => setField("quantity", event.target.value)} placeholder="Bijv. 5.000" className="input" /></Field>
                <Field label="Eenheid"><input value={form.unit} onChange={(event) => setField("unit", event.target.value)} placeholder="Bijv. stuks, uur of pallets" className="input" /></Field>
                <Field label="Uitvoering"><select value={form.locationType} onChange={(event) => setField("locationType", event.target.value)} className="input"><option value="on_site">Op locatie</option><option value="remote">Op afstand</option><option value="delivery">Levering</option></select></Field>
                <Field label="Herhaling"><select value={form.recurrenceType} onChange={(event) => setField("recurrenceType", event.target.value)} className="input"><option value="one_time">Eenmalig</option><option value="recurring">Terugkerend</option></select></Field>
                {form.locationType !== "remote" && <><Field label="Plaats"><input value={form.municipality} onChange={(event) => setField("municipality", event.target.value)} placeholder="Bijv. Utrecht" className="input" /></Field><Field label="Provincie"><input value={form.province} onChange={(event) => setField("province", event.target.value)} placeholder="Bijv. Utrecht" className="input" /></Field></>}
              </div>
            </FormSection>

            <FormSection number="03" title="Planning en budget" description="Alleen invullen wat al bekend is.">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Startdatum"><input name="startDate" type="date" value={form.startDate} onInput={(event) => setField("startDate", event.currentTarget.value)} className="input" /></Field>
                <Field label="Einddatum"><input name="endDate" type="date" value={form.endDate} min={form.startDate || undefined} onInput={(event) => setField("endDate", event.currentTarget.value)} className="input" /></Field>
                <Field label="Reageren vóór"><input name="responseDeadline" type="date" value={form.responseDeadline} min={new Date().toISOString().slice(0, 10)} onInput={(event) => setField("responseDeadline", event.currentTarget.value)} className="input" /></Field>
                <Field label="Urgentie"><select value={form.urgency} onChange={(event) => setField("urgency", event.target.value)} className="input"><option value="normal">Normaal</option><option value="week">Binnen een week</option><option value="hours_48">Binnen 48 uur</option><option value="urgent_today">Vandaag / spoed</option></select></Field>
                <Field label="Budgetvorm"><select value={form.budgetType} onChange={(event) => setField("budgetType", event.target.value)} className="input"><option value="open">In overleg</option><option value="fixed">Vast budget</option><option value="range">Budgetrange</option><option value="per_hour">Per uur</option><option value="per_unit">Per stuk</option><option value="per_project">Per project</option><option value="discuss">Eerst bespreken</option></select></Field>
                {!["open", "discuss"].includes(form.budgetType) && <Field label={form.budgetType === "range" ? "Budget vanaf" : "Budget / tarief"}><input type="number" min="0" step="0.01" value={form.budgetMin} onChange={(event) => setField("budgetMin", event.target.value)} placeholder="€" className="input" /></Field>}
                {form.budgetType === "range" && <Field label="Budget tot"><input type="number" min={form.budgetMin || "0"} step="0.01" value={form.budgetMax} onChange={(event) => setField("budgetMax", event.target.value)} placeholder="€" className="input" /></Field>}
              </div>
            </FormSection>

            <FormSection number="04" title="Zichtbaarheid" description="Bepaal wie deze kans kan vinden.">
              <div className="grid gap-2">
                <Radio value="public" checked={form.visibilityMode === "public"} onChange={() => setField("visibilityMode", "public")} title="Zichtbaar voor alle bedrijven" body="Geschikt als je breed wilt oriënteren." />
                <Radio value="matched_only" checked={form.visibilityMode === "matched_only"} onChange={() => setField("visibilityMode", "matched_only")} title="Alleen voor gematchte bedrijven" body="Vynta toont de kans alleen aan bedrijven die inhoudelijk aansluiten." />
                <Radio value="after_interest" checked={form.visibilityMode === "after_interest"} onChange={() => setField("visibilityMode", "after_interest")} title="Openbaar, contact pas na interesse" body="De kans is vindbaar; gevoelige informatie deel je later in een gesprek." />
              </div>
            </FormSection>
          </div>

          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-sm font-semibold">Klaar om te publiceren?</p>
              <ul className="mt-3 space-y-2 text-sm text-muted"><Checklist done={form.title.trim().length >= 8}>Concrete titel</Checklist><Checklist done={form.description.trim().length >= 30}>Duidelijke beschrijving</Checklist><Checklist done={Boolean(form.categoryId)}>Sector gekozen</Checklist><Checklist done={form.locationType === "remote" || Boolean(form.municipality)}>Locatie vermeld</Checklist></ul>
              {error && <div className="mt-4 flex gap-2 rounded-lg border border-red-300/50 bg-red-50 p-3 text-xs leading-5 text-red-700" role="alert"><AlertCircle size={15} className="mt-0.5 shrink-0" />{error}</div>}
              <button type="submit" disabled={publishing} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 disabled:opacity-50">{publishing ? <Loader2 size={17} className="animate-spin" /> : opportunityId ? <Check size={17} /> : <ArrowRight size={17} />}{publishing ? "Bezig…" : opportunityId ? "Wijzigingen opslaan" : "Kans publiceren"}</button>
              {!opportunityId && <p className="mt-3 text-center text-xs text-muted">{saving ? "Concept opslaan…" : savedAt ? `Concept opgeslagen om ${new Date(savedAt).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}` : "Je invoer wordt automatisch als concept bewaard."}</p>}
            </div>
          </aside>
        </form>
      )}
    </main>
  );
}

function OpportunityPreview({ form, categories }: { form: FormState; categories: ServiceCategory[] }) {
  const category = categories.find((item) => item.id === form.categoryId)?.name;
  return <section className="mx-auto max-w-3xl" aria-label="Voorbeeld van de kans"><div className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted"><Eye size={16} /> Zo zien andere bedrijven je kans</div><article className="rounded-xl border border-border bg-surface p-5 sm:p-7"><div className="flex flex-wrap gap-2 text-xs font-semibold text-muted"><span className="rounded-md bg-surface-2 px-2 py-1">{form.opportunityType === "request" ? "Opdracht" : "Zakelijke kans"}</span>{category && <span className="rounded-md bg-surface-2 px-2 py-1">{category}</span>}</div><h2 className="mt-4 text-2xl font-semibold tracking-[-0.035em]">{form.title || "Titel van je kans"}</h2><p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-muted">{form.description || "Je beschrijving verschijnt hier."}</p><div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-4 text-sm text-muted"><span className="inline-flex items-center gap-1.5"><MapPin size={15} />{form.locationType === "remote" ? "Op afstand" : form.municipality || "Locatie nog niet ingevuld"}</span><span className="inline-flex items-center gap-1.5"><Bookmark size={15} />{form.budgetType === "open" ? "Budget in overleg" : form.budgetMin ? `Vanaf € ${form.budgetMin}` : "Budget nog niet ingevuld"}</span></div></article></section>;
}

function FormSection({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return <section className="grid gap-5 border-t border-border pt-5 sm:grid-cols-[150px_minmax(0,1fr)]"><div><p className="text-xs font-semibold text-brand">{number}</p><h2 className="mt-1 text-base font-semibold">{title}</h2><p className="mt-1 text-xs leading-5 text-muted">{description}</p></div><div className="space-y-4">{children}</div></section>;
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return <label className="grid min-w-0 gap-1.5"><span className="flex items-center justify-between gap-2 text-sm font-semibold"><span>{label}{required && <span className="ml-1 text-brand" aria-hidden>*</span>}</span>{hint && <span className="text-xs font-normal text-muted">{hint}</span>}</span>{children}</label>;
}

function Radio({ value, checked, onChange, title, body }: { value: string; checked: boolean; onChange: () => void; title: string; body: string }) {
  return <label className={cn("flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors", checked ? "border-foreground bg-surface" : "border-border hover:border-border-strong")}><input type="radio" name="visibility" value={value} checked={checked} onChange={onChange} className="mt-1 accent-[var(--brand)]" /><span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs leading-5 text-muted">{body}</span></span></label>;
}

function Checklist({ done, children }: { done: boolean; children: React.ReactNode }) {
  return <li className={cn("flex items-center gap-2", done ? "text-foreground" : "text-muted")}><span className={cn("grid h-4 w-4 place-items-center rounded-full border", done && "border-brand bg-brand text-brand-fg")}>{done && <Check size={10} />}</span>{children}</li>;
}
