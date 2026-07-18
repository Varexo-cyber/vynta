"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  ArrowLeft,
  Play,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import {
  HELP_CATEGORIES,
  KNOWLEDGE_BASE,
  searchKnowledgeBase,
  type HelpCategory,
  type KnowledgeArticle,
} from "@/lib/help-knowledge";
import { helpActions, type HelpActionId } from "@/lib/help-actions";
import { useHelp } from "@/components/help/help-provider";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {};

export function HelpCenterClient() {
  const router = useRouter();
  const { executeAction, startGuidedMode } = useHelp();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<HelpCategory | null>(null);
  const [activeArticle, setActiveArticle] = useState<KnowledgeArticle | null>(null);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchKnowledgeBase(query).slice(0, 10);
  }, [query]);

  const categoryArticles = useMemo(() => {
    if (!activeCategory) return [];
    return KNOWLEDGE_BASE.filter((a) => a.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-32 pt-5 lg:pt-10">
      {/* Back to app */}
      <Link href="/feed" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground press">
        <ArrowLeft size={16} /> Terug naar Vynta
      </Link>

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Helpcentrum</h1>
        <p className="mt-2 text-base text-muted">Waar kunnen we je mee helpen?</p>
      </div>

      {/* Search */}
      <div className="mx-auto mb-8 max-w-xl">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5">
          <Search size={20} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek naar uitleg…"
            className="flex-1 bg-transparent text-[17px] outline-none placeholder:text-muted"
            autoFocus
          />
        </div>
      </div>

      {/* Search results */}
      {query.trim() && searchResults.length > 0 && (
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold text-muted">Gevonden artikelen</p>
          <div className="grid gap-2">
            {searchResults.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onClick={() => setActiveArticle(article)}
              />
            ))}
          </div>
        </div>
      )}

      {query.trim() && searchResults.length === 0 && (
        <div className="mb-8 rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">
            Geen resultaten gevonden voor "{query}". Probeer een andere zoekterm of vraag de Vynta Assistent.
          </p>
        </div>
      )}

      {/* Article detail */}
      {activeArticle && !query.trim() && (
        <ArticleDetail
          article={activeArticle}
          onBack={() => setActiveArticle(null)}
          onAction={executeAction}
          onGuidedMode={startGuidedMode}
        />
      )}

      {/* Categories */}
      {!query.trim() && !activeArticle && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {HELP_CATEGORIES.map((cat) => {
              const count = KNOWLEDGE_BASE.filter((a) => a.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 text-left transition-all hover:border-border-strong hover:bg-surface-2/30 press"
                >
                  <div>
                    <p className="text-sm font-semibold">{cat.label}</p>
                    <p className="text-xs text-muted">{count} {count === 1 ? "artikel" : "artikelen"}</p>
                  </div>
                  <ChevronRight size={18} className="text-muted" />
                </button>
              );
            })}
          </div>

          {/* Category articles */}
          {activeCategory && (
            <div className="mt-8">
              <div className="mb-4 flex items-center gap-2">
                <button
                  onClick={() => setActiveCategory(null)}
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  Alle categorieën
                </button>
                <ChevronRight size={16} className="text-muted" />
                <span className="text-sm font-semibold">
                  {HELP_CATEGORIES.find((c) => c.id === activeCategory)?.label}
                </span>
              </div>
              <div className="grid gap-2">
                {categoryArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onClick={() => setActiveArticle(article)}
                  />
                ))}
                {categoryArticles.length === 0 && (
                  <p className="text-sm text-muted">Nog geen artikelen in deze categorie.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ArticleCard({ article, onClick }: { article: KnowledgeArticle; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 text-left transition-all hover:border-border-strong hover:bg-surface-2/30 press"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{article.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted">{article.answer}</p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-muted" />
    </button>
  );
}

function ArticleDetail({
  article,
  onBack,
  onAction,
  onGuidedMode,
}: {
  article: KnowledgeArticle;
  onBack: () => void;
  onAction: (id: HelpActionId) => void;
  onGuidedMode: (tourId: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> Terug
      </button>

      <h2 className="text-xl font-bold tracking-tight">{article.title}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">{article.answer}</p>

      {article.steps && article.steps.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold">Stappen</p>
          <ol className="space-y-2">
            {article.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-bold text-foreground">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-foreground/90">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Action buttons */}
      {(article.actions?.length ?? 0) > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {article.actions!.map((actionId) => {
            const action = helpActions[actionId];
            if (!action) return null;
            return (
              <Button
                key={actionId}
                variant="primary"
                size="sm"
                onClick={() => onAction(actionId)}
              >
                {action.label}
              </Button>
            );
          })}
          {article.tourId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGuidedMode(article.tourId!)}
            >
              <Play size={14} /> Start interactieve uitleg
            </Button>
          )}
        </div>
      )}

      <p className="mt-6 border-t border-border pt-4 text-xs text-subtle">
        Laatst bijgewerkt: {article.lastUpdated}
      </p>
    </div>
  );
}
