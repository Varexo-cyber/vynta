"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HelpCircle, X, ExternalLink } from "lucide-react";
import { useHelp } from "@/components/help/help-provider";
import { getArticleById } from "@/lib/help-knowledge";
import { cn } from "@/lib/utils";

export function ContextualHelp({
  topic,
  label,
  className,
}: {
  topic: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { executeAction } = useHelp();
  const article = getArticleById(topic);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [open]);

  if (!article) return null;

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "grid h-5 w-5 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground",
          className
        )}
        aria-label={label ?? `Uitleg: ${article.title}`}
        aria-expanded={open}
      >
        <HelpCircle size={15} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-7 z-[75] w-72 rounded-xl border border-border bg-surface p-4 shadow-xl"
            role="tooltip"
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold">{article.title}</h4>
              <button
                onClick={() => setOpen(false)}
                className="text-muted transition-colors hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{article.answer}</p>
            {article.steps && article.steps.length > 0 && (
              <ol className="mt-2 space-y-1">
                {article.steps.slice(0, 4).map((step, i) => (
                  <li key={i} className="flex gap-2 text-xs text-muted">
                    <span className="font-semibold text-foreground">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  if (article.actions?.[0]) executeAction(article.actions[0]);
                  setOpen(false);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand transition-colors hover:opacity-80"
              >
                <ExternalLink size={12} />
                Meer uitleg bekijken
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
