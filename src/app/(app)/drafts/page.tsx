"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { getDrafts, deleteDraft } from "@/lib/actions";
import { useApp } from "@/components/app-store";
import { Button } from "@/components/ui/primitives";
import { POST_TYPES } from "@/lib/need-types";
import type { Draft } from "@/lib/types";

export default function DraftsPage() {
  const { setCreateOpen, setDraftToLoad } = useApp();
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDrafts().then((list) => {
      setDrafts(list);
      setLoading(false);
    });
  }, []);

  const resume = (draft: Draft) => {
    setDraftToLoad(draft);
    setCreateOpen(true);
    router.push("/feed");
  };

  const remove = async (id: string) => {
    await deleteDraft(id);
    setDrafts((list) => list.filter((d) => d.id !== id));
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-5 lg:pt-10">
      <h1 className="text-3xl font-bold tracking-tight">Mijn concepten</h1>
      <p className="mt-2 text-muted">
        Concepten worden automatisch opgeslagen terwijl je een post maakt.
      </p>

      {loading ? (
        <div className="mt-10 flex items-center justify-center gap-2 text-muted">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
          Laden…
        </div>
      ) : drafts.length === 0 ? (
        <p className="mt-10 text-center text-muted">Je hebt nog geen concepten.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {drafts.map((d) => (
            <div
              key={d.id}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">
                  <FileText size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {POST_TYPES[d.data.type ?? "update"].label}
                  </p>
                  <p className="line-clamp-2 text-sm text-foreground/80">
                    {d.data.body || "Geen tekst"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(d.updatedAt).toLocaleString("nl-NL")}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => resume(d)}>
                  <Pencil size={16} /> Bewerken
                </Button>
                <Button size="sm" variant="outline" onClick={() => remove(d.id)}>
                  <Trash2 size={16} /> Verwijderen
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
