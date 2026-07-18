"use client";

import { useState, useEffect } from "react";
import {
  getDashboardStats,
  getImprovementQueue,
  resolveImprovementItem,
  blockImprovementItem,
  type DashboardStats,
  type ImprovementQueueItem,
} from "@/lib/assistant-admin";

export default function AssistantAdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [queue, setQueue] = useState<ImprovementQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveAnswer, setResolveAnswer] = useState("");

  useEffect(() => {
    Promise.all([getDashboardStats(), getImprovementQueue()])
      .then(([s, q]) => {
        setStats(s);
        setQueue(q);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = async (id: string) => {
    try {
      await resolveImprovementItem(id, resolveAnswer, null);
      setQueue((q) => q.filter((item) => item.id !== id));
      setResolvingId(null);
      setResolveAnswer("");
    } catch {}
  };

  const handleBlock = async (id: string) => {
    try {
      await blockImprovementItem(id);
      setQueue((q) => q.filter((item) => item.id !== id));
    } catch {}
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Laden…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Vynta Assistent — Verbeterdashboard</h1>

      {/* Stats */}
      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Totale vragen" value={stats.totalQueries} />
          <StatCard label="Succesrate" value={`${stats.successRate}%`} />
          <StatCard label="Negatieve feedback" value={stats.negativeFeedback} />
          <StatCard label="Open verbeteringen" value={stats.openImprovements} />
        </div>
      )}

      {/* Top questions */}
      {stats && stats.topQuestions.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Meest gestelde vragen</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {stats.topQuestions.map((q, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border p-3 last:border-0">
                <span className="text-sm">{q.query}</span>
                <span className="text-sm font-semibold text-muted">{q.count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confused intents */}
      {stats && stats.confusedIntents.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Meest verwarde intenties</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {stats.confusedIntents.map((c, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border p-3 last:border-0">
                <span className="text-sm font-mono">{c.intent}</span>
                <span className="text-sm font-semibold text-muted">{c.count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvement queue */}
      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Verbeterwachtrij</h2>
        {queue.length === 0 ? (
          <p className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
            Geen openstaande verbeteringen.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {queue.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.questionCluster}</p>
                    <p className="mt-1 text-xs text-muted">
                      {item.negativeFeedbackCount} negatieve feedback · {item.failureReason}
                    </p>
                    {item.exampleQuestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.exampleQuestions.map((q, i) => (
                          <span key={i} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
                            {q}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.currentAnswer && (
                      <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
                        Huidig antwoord: {item.currentAnswer.slice(0, 120)}…
                      </p>
                    )}
                  </div>
                </div>
                {resolvingId === item.id ? (
                  <div className="mt-3 flex flex-col gap-2">
                    <textarea
                      value={resolveAnswer}
                      onChange={(e) => setResolveAnswer(e.target.value)}
                      placeholder="Correct antwoord…"
                      rows={3}
                      className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand/40"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolve(item.id)}
                        className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
                      >
                        Publiceren
                      </button>
                      <button
                        onClick={() => {
                          setResolvingId(null);
                          setResolveAnswer("");
                        }}
                        className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted"
                      >
                        Annuleren
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        setResolvingId(item.id);
                        setResolveAnswer(item.currentAnswer ?? "");
                      }}
                      className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-3"
                    >
                      Correct antwoord instellen
                    </button>
                    <button
                      onClick={() => handleBlock(item.id)}
                      className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted hover:text-red-500"
                    >
                      Blokkeren
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
