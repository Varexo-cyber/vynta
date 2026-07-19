"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BadgeCheck,
  Building2,
  CheckCircle2,
  FileWarning,
  Flag,
  History,
  MessageSquareWarning,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/app-store";
import {
  adminDeletePost,
  adminResolveReport,
  adminSaveAccountNotes,
  adminSetAccountStatus,
  adminSetCompanyVerified,
  adminSetPlatformRole,
  type OwnerDashboardData,
  type OwnerReport,
} from "@/lib/platform-admin";
import type { AccountStatus, PlatformRole } from "@/lib/auth";

type Tab = "overview" | "reports" | "posts" | "accounts" | "audit";
type DialogAction =
  | { kind: "delete-post"; id: string; title: string; description: string; requireReason: true }
  | { kind: "account-status"; id: string; status: AccountStatus; title: string; description: string; requireReason: boolean }
  | { kind: "report"; id: string; reportKind: "post" | "chat"; status: "reviewed" | "dismissed"; title: string; description: string; requireReason: false }
  | { kind: "role"; id: string; role: PlatformRole; title: string; description: string; requireReason: false };

const TABS: { id: Tab; label: string; icon: typeof ShieldCheck }[] = [
  { id: "overview", label: "Overzicht", icon: Activity },
  { id: "reports", label: "Meldingen", icon: Flag },
  { id: "posts", label: "Posts", icon: FileWarning },
  { id: "accounts", label: "Accounts", icon: Users },
  { id: "audit", label: "Auditlog", icon: History },
];

export function OwnerDashboardClient({ data }: { data: OwnerDashboardData }) {
  const router = useRouter();
  const { toast } = useApp();
  const [tab, setTab] = useState<Tab>(data.stats.openReports > 0 ? "reports" : "overview");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogAction | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();

  const refresh = () => startRefresh(() => router.refresh());
  const normalizedQuery = query.trim().toLowerCase();
  const accounts = useMemo(
    () => data.accounts.filter((a) => !normalizedQuery || `${a.companyName} ${a.email} ${a.handle}`.toLowerCase().includes(normalizedQuery)),
    [data.accounts, normalizedQuery]
  );
  const posts = useMemo(
    () => data.posts.filter((p) => !normalizedQuery || `${p.companyName} ${plainText(p.body)} ${p.type}`.toLowerCase().includes(normalizedQuery)),
    [data.posts, normalizedQuery]
  );

  const runDialogAction = async () => {
    if (!dialog) return;
    if (dialog.requireReason && reason.trim().length < 3) {
      toast("Reden verplicht", "Geef kort aan waarom je deze actie uitvoert.");
      return;
    }
    setBusyId(dialog.id);
    let result: { ok: boolean; error?: string };
    if (dialog.kind === "delete-post") result = await adminDeletePost(dialog.id, reason);
    else if (dialog.kind === "account-status") result = await adminSetAccountStatus(dialog.id, dialog.status, reason);
    else if (dialog.kind === "report") result = await adminResolveReport(dialog.reportKind, dialog.id, dialog.status, reason);
    else result = await adminSetPlatformRole(dialog.id, dialog.role);
    setBusyId(null);
    if (!result.ok) {
      toast("Actie mislukt", result.error);
      return;
    }
    toast("Owneractie uitgevoerd", "De wijziging is vastgelegd in het auditlog.");
    setDialog(null);
    setReason("");
    refresh();
  };

  const quickAction = async (id: string, action: () => Promise<{ ok: boolean; error?: string }>, success: string) => {
    setBusyId(id);
    const result = await action();
    setBusyId(null);
    if (!result.ok) toast("Actie mislukt", result.error);
    else {
      toast(success, "De wijziging is vastgelegd in het auditlog.");
      refresh();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                <ShieldCheck size={14} /> {data.viewerRole === "owner" ? "Platform owner" : "Platform admin"}
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight">Owner Center</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted">Moderatie, accounts en platformgezondheid op één beveiligde plek.</p>
            </div>
            <p className={cn("text-xs text-muted", isRefreshing && "animate-pulse")}>{isRefreshing ? "Gegevens vernieuwen…" : "Alle acties worden gelogd"}</p>
          </div>
          <div className="mt-7 flex gap-1 overflow-x-auto rounded-2xl bg-surface-2 p-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex min-w-fit items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                  tab === item.id ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
                )}
              >
                <item.icon size={17} /> {item.label}
                {item.id === "reports" && data.stats.openReports > 0 && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">{data.stats.openReports}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {tab === "overview" && <Overview data={data} onNavigate={setTab} />}
        {tab === "reports" && <Reports reports={data.reports} busyId={busyId} setDialog={setDialog} />}
        {tab === "posts" && (
          <>
            <SearchField value={query} onChange={setQuery} placeholder="Zoek op bedrijf, inhoud of type…" />
            <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
              {posts.map((post) => (
                <div key={post.id} className="flex flex-col gap-3 border-b border-border p-4 last:border-0 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="font-semibold text-foreground">{post.companyName}</span>
                      <span>·</span><span>{post.type}</span><span>·</span><span>{formatDate(post.createdAt)}</span>
                      {post.reports > 0 && <span className="rounded-full bg-red-500/10 px-2 py-0.5 font-semibold text-red-600">{post.reports} melding(en)</span>}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-foreground">{plainText(post.body)}</p>
                  </div>
                  <button
                    disabled={busyId === post.id}
                    onClick={() => setDialog({ kind: "delete-post", id: post.id, title: "Post definitief verwijderen?", description: "De post en gekoppelde reacties verdwijnen voor iedereen. De reden wordt in het auditlog opgeslagen.", requireReason: true })}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Trash2 size={16} /> Verwijderen
                  </button>
                </div>
              ))}
              {posts.length === 0 && <EmptyState text="Geen posts gevonden." />}
            </div>
          </>
        )}
        {tab === "accounts" && (
          <>
            <SearchField value={query} onChange={setQuery} placeholder="Zoek op bedrijf, e-mail of gebruikersnaam…" />
            <div className="mt-4 space-y-3">
              {accounts.map((account) => (
                <div key={account.userId} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{account.companyName}</p>
                        {account.companyVerified && <BadgeCheck size={16} className="text-blue-500" />}
                        <RoleBadge role={account.platformRole} />
                        <StatusBadge status={account.accountStatus} />
                      </div>
                      <p className="mt-1 text-sm text-muted">{account.email} · @{account.handle}</p>
                      <p className="mt-2 text-xs text-muted">{account.posts} posts · {account.reportsReceived} meldingen ontvangen · sinds {formatDate(account.createdAt)}</p>
                      <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-muted sm:grid-cols-2 xl:grid-cols-3">
                        <div><dt className="inline font-semibold text-foreground">Sector: </dt><dd className="inline">{account.industry || "Niet ingevuld"}</dd></div>
                        <div><dt className="inline font-semibold text-foreground">Vestiging: </dt><dd className="inline">{[account.city, account.province, account.country].filter(Boolean).join(", ") || "Niet ingevuld"}</dd></div>
                        <div><dt className="inline font-semibold text-foreground">Telefoon: </dt><dd className="inline">{account.phone || "Niet ingevuld"}</dd></div>
                        <div><dt className="inline font-semibold text-foreground">Website: </dt><dd className="inline break-all">{account.website || "Niet ingevuld"}</dd></div>
                        <div><dt className="inline font-semibold text-foreground">KVK: </dt><dd className="inline">{account.kvkNumber || "Niet ingevuld"}</dd></div>
                        <div><dt className="inline font-semibold text-foreground">BTW: </dt><dd className="inline">{account.vatNumber || "Niet ingevuld"}</dd></div>
                      </dl>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={busyId === account.companyId}
                        onClick={() => quickAction(account.companyId, () => adminSetCompanyVerified(account.companyId, !account.companyVerified), account.companyVerified ? "Verificatie verwijderd" : "Bedrijf geverifieerd")}
                        className="rounded-xl bg-surface-2 px-3 py-2 text-xs font-semibold hover:bg-surface-3 disabled:opacity-50"
                      >
                        {account.companyVerified ? "Verificatie intrekken" : "Verifiëren"}
                      </button>
                      {account.userId !== data.viewerUserId && account.accountStatus === "active" && (
                        <>
                          <button
                            onClick={() => setDialog({ kind: "account-status", id: account.userId, status: "suspended", title: "Account schorsen?", description: "Alle actieve sessies worden direct ingetrokken. De gebruiker kan na heractivering weer inloggen.", requireReason: true })}
                            className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-700"
                          >
                            Schorsen
                          </button>
                          {data.viewerRole === "owner" && (
                            <button
                              onClick={() => setDialog({ kind: "account-status", id: account.userId, status: "deactivated", title: "Account deactiveren?", description: "Het account wordt uitgeschakeld en alle actieve sessies worden ingetrokken. De gegevens blijven voor controle en herstel bewaard.", requireReason: true })}
                              className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-700"
                            >
                              Deactiveren
                            </button>
                          )}
                        </>
                      )}
                      {account.userId !== data.viewerUserId && account.accountStatus !== "active" && (
                        <button
                          onClick={() => setDialog({ kind: "account-status", id: account.userId, status: "active", title: "Account heractiveren?", description: "De gebruiker kan daarna weer inloggen.", requireReason: false })}
                          className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700"
                        >
                          Heractiveren
                        </button>
                      )}
                      {data.viewerRole === "owner" && account.userId !== data.viewerUserId && (
                        <select
                          value={account.platformRole}
                          onChange={(e) => {
                            const role = e.target.value as PlatformRole;
                            setDialog({ kind: "role", id: account.userId, role, title: "Platformrol wijzigen?", description: `${account.email} krijgt de rol ${role}.`, requireReason: false });
                          }}
                          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold outline-none"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                          <option value="owner">Owner</option>
                        </select>
                      )}
                    </div>
                  </div>
                  <AccountNotes account={account} busyId={busyId} onSave={quickAction} />
                </div>
              ))}
              {accounts.length === 0 && <EmptyState text="Geen accounts gevonden." />}
            </div>
          </>
        )}
        {tab === "audit" && (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {data.audit.map((item) => (
              <div key={item.id} className="grid gap-1 border-b border-border p-4 text-sm last:border-0 sm:grid-cols-[180px_1fr_180px]">
                <span className="font-semibold">{item.actor}</span>
                <span><span className="font-mono text-xs">{item.action}</span> · {item.targetType} {item.targetId.slice(0, 8)}</span>
                <span className="text-xs text-muted sm:text-right">{formatDateTime(item.createdAt)}</span>
              </div>
            ))}
            {data.audit.length === 0 && <EmptyState text="Nog geen owneracties vastgelegd." />}
          </div>
        )}
      </div>

      <ActionDialog
        action={dialog}
        reason={reason}
        setReason={setReason}
        loading={Boolean(dialog && busyId === dialog.id)}
        onCancel={() => { setDialog(null); setReason(""); }}
        onConfirm={runDialogAction}
      />
    </div>
  );
}

function Overview({ data, onNavigate }: { data: OwnerDashboardData; onNavigate: (tab: Tab) => void }) {
  const cards = [
    { label: "Accounts", value: data.stats.users, sub: `${data.stats.activeUsers} actief`, icon: Users, tab: "accounts" as Tab },
    { label: "Bedrijven", value: data.stats.companies, sub: "geregistreerd", icon: Building2, tab: "accounts" as Tab },
    { label: "Posts", value: data.stats.posts, sub: "op het platform", icon: FileWarning, tab: "posts" as Tab },
    { label: "Open meldingen", value: data.stats.openReports, sub: "actie vereist", icon: Flag, tab: "reports" as Tab },
  ];
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <button key={card.label} onClick={() => onNavigate(card.tab)} className="rounded-2xl border border-border bg-surface p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between"><card.icon size={20} className="text-muted" /><span className="text-xs text-muted">Bekijken →</span></div>
            <p className="mt-6 text-3xl font-bold tracking-tight">{card.value}</p>
            <p className="mt-1 text-sm font-semibold">{card.label}</p>
            <p className="text-xs text-muted">{card.sub}</p>
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-semibold">Aandachtspunten</h2>
          <div className="mt-4 space-y-3">
            <HealthRow ok={data.stats.openReports === 0} label={data.stats.openReports === 0 ? "Geen open meldingen" : `${data.stats.openReports} open meldingen wachten op beoordeling`} />
            <HealthRow ok={data.stats.suspendedUsers === 0} label={`${data.stats.suspendedUsers} geschorste accounts`} />
            <HealthRow ok label="Owneracties worden centraal gelogd" />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-semibold">Beveiligingsmodel</h2>
          <p className="mt-3 text-sm leading-6 text-muted">Owner- en adminrechten worden bij iedere serveractie opnieuw gecontroleerd. Een verborgen knop of handmatig verzoek zonder juiste rol geeft geen toegang.</p>
        </div>
      </div>
    </div>
  );
}

function Reports({ reports, busyId, setDialog }: { reports: OwnerReport[]; busyId: string | null; setDialog: (action: DialogAction) => void }) {
  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div key={`${report.kind}-${report.id}`} className={cn("rounded-2xl border bg-surface p-4", report.status === "open" ? "border-amber-500/30" : "border-border opacity-75")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {report.kind === "post" ? <FileWarning size={15} /> : <MessageSquareWarning size={15} />}
                <span className="font-semibold uppercase tracking-wide">{report.kind === "post" ? "Postmelding" : "Chatmelding"}</span>
                <StatusBadge status={report.status === "open" ? "suspended" : "active"} label={report.status} />
                <span className="text-muted">{formatDateTime(report.createdAt)}</span>
              </div>
              <p className="mt-3 text-sm"><span className="font-semibold">{report.reporterName}</span> rapporteerde <span className="font-semibold">{report.reportedName}</span> wegens <span className="font-semibold">{report.reason}</span>.</p>
              {report.postBody && <p className="mt-2 rounded-xl bg-surface-2 p-3 text-sm text-muted">“{plainText(report.postBody).slice(0, 240)}”</p>}
              {report.details && <p className="mt-2 text-sm text-muted">Toelichting: {report.details}</p>}
              {report.includeMessages && (
                <div className="mt-3 rounded-xl border border-border bg-surface-2 p-3">
                  <p className="text-xs font-semibold text-amber-700">
                    Laatste {report.evidence.length} meegestuurde chatberichten
                  </p>
                  {report.evidence.length > 0 ? (
                    <div className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
                      {report.evidence.map((message, index) => (
                        <div key={`${message.createdAt}-${index}`} className="rounded-lg bg-surface px-3 py-2 text-xs">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold">{message.sender}</span>
                            <span className="shrink-0 text-muted">{formatDateTime(message.createdAt)}</span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap break-words text-muted">{message.body || "Bericht zonder tekst"}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted">Er zijn geen chatberichten beschikbaar.</p>
                  )}
                </div>
              )}
              {report.moderatorNotes && <p className="mt-2 text-xs text-muted">Moderatornotitie: {report.moderatorNotes}</p>}
            </div>
            {report.status === "open" && (
              <div className="flex gap-2">
                <button disabled={busyId === report.id} onClick={() => setDialog({ kind: "report", id: report.id, reportKind: report.kind, status: "reviewed", title: "Melding afhandelen?", description: "Markeer deze melding als beoordeeld. Je kunt optioneel een moderatornotitie toevoegen.", requireReason: false })} className="rounded-xl bg-foreground px-3 py-2 text-xs font-semibold text-background disabled:opacity-50">Beoordeeld</button>
                <button disabled={busyId === report.id} onClick={() => setDialog({ kind: "report", id: report.id, reportKind: report.kind, status: "dismissed", title: "Melding afwijzen?", description: "De melding wordt als ongegrond gesloten.", requireReason: false })} className="rounded-xl bg-surface-2 px-3 py-2 text-xs font-semibold disabled:opacity-50">Afwijzen</button>
              </div>
            )}
          </div>
        </div>
      ))}
      {reports.length === 0 && <EmptyState text="Er zijn nog geen meldingen." />}
    </div>
  );
}

function AccountNotes({ account, busyId, onSave }: { account: OwnerDashboardData["accounts"][number]; busyId: string | null; onSave: (id: string, action: () => Promise<{ ok: boolean; error?: string }>, success: string) => Promise<void> }) {
  const [notes, setNotes] = useState(account.adminNotes ?? "");
  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={1} placeholder="Interne ownernotitie…" className="min-h-10 flex-1 resize-y rounded-xl bg-surface-2 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-border-strong" />
      <button disabled={busyId === account.userId} onClick={() => onSave(account.userId, () => adminSaveAccountNotes(account.userId, notes), "Notitie opgeslagen")} className="rounded-xl bg-surface-2 px-4 py-2 text-xs font-semibold hover:bg-surface-3 disabled:opacity-50">Notitie opslaan</button>
    </div>
  );
}

function ActionDialog({ action, reason, setReason, loading, onCancel, onConfirm }: { action: DialogAction | null; reason: string; setReason: (value: string) => void; loading: boolean; onCancel: () => void; onConfirm: () => void }) {
  if (!action) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="owner-dialog-title">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div><h2 id="owner-dialog-title" className="text-lg font-bold">{action.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{action.description}</p></div>
          <button onClick={onCancel} disabled={loading} aria-label="Sluiten" className="rounded-full p-2 text-muted hover:bg-surface-2"><X size={18} /></button>
        </div>
        <label className="mt-5 block text-sm font-semibold">{action.requireReason ? "Reden (verplicht)" : "Notitie (optioneel)"}</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder={action.requireReason ? "Leg kort uit waarom…" : "Voeg context toe voor het auditlog…"} className="mt-2 w-full resize-none rounded-2xl bg-surface-2 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-border-strong" />
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} disabled={loading} className="rounded-full px-4 py-2 text-sm font-semibold text-muted hover:bg-surface-2">Annuleren</button>
          <button onClick={onConfirm} disabled={loading || (action.requireReason && reason.trim().length < 3)} className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background disabled:opacity-40">{loading ? "Bezig…" : "Bevestigen"}</button>
        </div>
      </div>
    </div>
  );
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3"><Search size={18} className="text-muted" /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted" /></label>;
}

function RoleBadge({ role }: { role: PlatformRole }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", role === "owner" ? "bg-purple-500/10 text-purple-700" : role === "admin" ? "bg-blue-500/10 text-blue-700" : "bg-surface-2 text-muted")}>{role}</span>;
}

function StatusBadge({ status, label }: { status: AccountStatus; label?: string }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", status === "active" ? "bg-emerald-500/10 text-emerald-700" : status === "suspended" ? "bg-amber-500/10 text-amber-700" : "bg-red-500/10 text-red-700")}>{label ?? status}</span>;
}

function HealthRow({ ok, label }: { ok: boolean; label: string }) {
  return <div className="flex items-center gap-3 text-sm">{ok ? <CheckCircle2 size={17} className="text-emerald-600" /> : <ShieldOff size={17} className="text-amber-600" />}<span>{label}</span></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">{text}</div>;
}

function plainText(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
