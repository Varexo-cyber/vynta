"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Bell,
  Palette,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  FileText,
  HelpCircle,
  Sparkles,
  MessageSquare,
  Target,
  Brain,
  Download,
  Trash2,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useApp } from "@/components/app-store";
import { useHelp } from "@/components/help/help-provider";
import { signOut, getDrafts } from "@/lib/actions";
import { CompanyAvatar, VerifiedBadge } from "@/components/ui/primitives";
import { CompanyEditModal } from "@/components/company-edit-modal";
import { CompanyBrandingSettings } from "@/components/company-branding-settings";
import { cn } from "@/lib/utils";
import {
  exportAssistantData,
  wipeAllAssistantData,
  listMemories,
  deleteMemory,
  clearAllMemories,
} from "@/lib/assistant-server";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { me } = useApp();
  const router = useRouter();
  const {
    assistantEnabled, setAssistantEnabled,
    productTipsEnabled, setProductTipsEnabled,
    experienceLevel, setExperienceLevel,
    startTour,
  } = useHelp();
  const [editOpen, setEditOpen] = useState(false);
  const [draftCount, setDraftCount] = useState(0);
  const [memories, setMemories] = useState<{ id: string; memoryKey: string; memoryValue: string }[]>([]);

  useEffect(() => {
    getDrafts().then((drafts) => setDraftCount(drafts.length));
    listMemories().then(setMemories).catch(() => {});
  }, []);

  const handleExport = async () => {
    try {
      const data = await exportAssistantData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vynta-assistent-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const handleWipe = async () => {
    if (!confirm("Weet je zeker dat je alle assistentgesprekken en herinneringen wilt verwijderen? Dit kan niet ongedaan worden gemaakt.")) return;
    try {
      await wipeAllAssistantData();
      setMemories([]);
    } catch {}
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await deleteMemory(id);
      setMemories((m) => m.filter((mem) => mem.id !== id));
    } catch {}
  };

  const handleClearMemories = async () => {
    if (!confirm("Alle herinneringen verwijderen?")) return;
    try {
      await clearAllMemories();
      setMemories([]);
    } catch {}
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-32 pt-5 lg:pt-10">
      <CompanyEditModal key={editOpen ? 1 : 0} open={editOpen} onClose={() => setEditOpen(false)} />
      <h1 className="text-3xl font-bold tracking-tight">Instellingen</h1>

      {/* Company card */}
      <Link
        href={`/company/${me.id}`}
        className="mt-6 flex items-center gap-4 rounded-3xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
      >
        <CompanyAvatar name={me.name} color={me.logoColor} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-lg font-semibold">{me.name}</span>
            {me.verified && <VerifiedBadge size={16} />}
          </div>
          <p className="text-sm text-muted">{me.industry} · {me.city}</p>
        </div>
        <ChevronRight size={18} className="text-muted" />
      </Link>

      {/* Appearance */}
      <Section title="Weergave">
        <div className="flex items-center gap-2 p-2">
          {([
            { key: "light", label: "Licht", icon: Sun },
            { key: "dark", label: "Donker", icon: Moon },
            { key: "system", label: "Systeem", icon: Monitor },
          ] as const).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setTheme(opt.key)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1.5 rounded-xl py-3 text-sm font-semibold transition-all press",
                theme === opt.key
                  ? "bg-foreground text-background"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <opt.icon size={18} />
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Account">
        <Row icon={Building2} label="Bedrijfsgegevens" hint="Bewerken" onClick={() => setEditOpen(true)} />
        <Row
          icon={FileText}
          label="Mijn concepten"
          hint={draftCount > 0 ? `${draftCount} ${draftCount === 1 ? "concept" : "concepten"}` : "Geen concepten"}
          onClick={() => router.push("/drafts")}
        />
        <Row icon={ShieldCheck} label="Verificatie" hint={me.verified ? "Geverifieerd" : "Word geverifieerd"} />
      </Section>

      <CompanyBrandingSettings />

      <Section title="Voorkeuren">
        <Row icon={Bell} label="Meldingen" />
        <Row
          icon={Target}
          label="Kansen instellingen"
          hint="Diensten & voorkeuren"
          onClick={() => router.push("/settings/opportunities")}
        />
        <Row
          icon={Palette}
          label="Netwerken"
          hint={`${me.networks.length} verbonden`}
          onClick={() => router.push("/networks")}
        />
      </Section>

      <Section title="Uitleg en begeleiding">
        <div className="p-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <MessageSquare size={18} className="text-muted" />
              <span className="text-[15px] font-semibold">Vynta Assistent</span>
            </div>
            <ToggleSwitch checked={assistantEnabled} onChange={setAssistantEnabled} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-muted" />
              <span className="text-[15px] font-semibold">Producttips</span>
            </div>
            <ToggleSwitch checked={productTipsEnabled} onChange={setProductTipsEnabled} />
          </div>
          <div className="py-2">
            <p className="mb-2 text-[15px] font-semibold">Uitlegniveau</p>
            <div className="flex gap-2">
              {([
                { key: "basic", label: "Alleen de basis" },
                { key: "normal", label: "Normale begeleiding" },
                { key: "extensive", label: "Uitgebreide begeleiding" },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setExperienceLevel(opt.key)}
                  className={cn(
                    "flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all press",
                    experienceLevel === opt.key
                      ? "bg-foreground text-background"
                      : "bg-surface-2 text-muted hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Row
          icon={HelpCircle}
          label="Producttour opnieuw starten"
          hint="Korte rondleiding"
          onClick={() => startTour("product-tour")}
        />
        <Row
          icon={HelpCircle}
          label="Helpcentrum"
          hint="Alle uitleg"
          onClick={() => router.push("/help")}
        />
      </Section>

      {/* Assistant data & privacy */}
      <Section title="Vynta Assistent en gegevens">
        <div className="p-4">
          <p className="text-sm text-muted">
            Vynta bewaart je assistentgesprekken zodat je later verder kunt gaan en zodat de hulp beter op jouw situatie aansluit. Je hebt volledige controle over je gegevens.
          </p>
        </div>
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold">Gesprekshistorie bewaren</p>
              <p className="text-xs text-muted">Eerdere gesprekken opslaan om later te hervatten</p>
            </div>
            <ToggleSwitch checked={assistantEnabled} onChange={setAssistantEnabled} />
          </div>
        </div>
        <div className="border-t border-border p-4">
          <p className="mb-2 text-[15px] font-semibold">Opgeslagen herinneringen</p>
          {memories.length === 0 ? (
            <p className="text-sm text-muted">Nog geen herinneringen opgeslagen.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {memories.map((mem) => (
                <div key={mem.id} className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2">
                  <Brain size={14} className="shrink-0 text-brand" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold">{mem.memoryKey}</p>
                    <p className="text-xs text-muted">{mem.memoryValue}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteMemory(mem.id)}
                    className="grid h-6 w-6 place-items-center rounded-lg text-subtle hover:bg-surface hover:text-red-500"
                    aria-label="Herinnering verwijderen"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={handleClearMemories}
                className="mt-1 text-left text-xs font-semibold text-muted hover:text-foreground"
              >
                Alle herinneringen wissen
              </button>
            </div>
          )}
        </div>
        <Row
          icon={Download}
          label="Gesprekken exporteren"
          hint="JSON-bestand"
          onClick={handleExport}
        />
        <Row
          icon={Trash2}
          label="Alle assistentgegevens verwijderen"
          hint="Permanent"
          onClick={handleWipe}
        />
      </Section>

      <div className="mt-6">
        <button
          onClick={async () => {
            await signOut();
            router.push("/auth");
          }}
          className="flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-red-500/[0.03] p-4 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/5 press dark:border-red-900/30"
        >
          <LogOut size={18} /> Uitloggen
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-subtle">Vynta · Het Digitale Bedrijfsnetwerk van Nederland</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {children}
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: typeof Building2;
  label: string;
  hint?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-border p-4 text-left transition-colors hover:bg-surface-2 last:border-0 press"
    >
      <Icon size={18} className="text-muted" />
      <span className="flex-1 text-[15px] font-semibold">{label}</span>
      {hint && <span className="text-sm text-muted">{hint}</span>}
      <ChevronRight size={16} className="text-muted" />
    </button>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 rounded-full transition-colors",
        checked ? "bg-foreground" : "bg-surface-2"
      )}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={cn(
          "absolute top-1 h-5 w-5 rounded-full bg-background shadow transition-all",
          checked ? "left-6" : "left-1"
        )}
      />
    </button>
  );
}
