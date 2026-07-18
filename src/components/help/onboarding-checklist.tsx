"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, ChevronRight, Eye, EyeOff, Play } from "lucide-react";
import { useHelp } from "@/components/help/help-provider";
import { CHECKLIST_TASKS } from "@/lib/help-checklist";
import { helpActions } from "@/lib/help-actions";
import { cn } from "@/lib/utils";

export function OnboardingChecklist() {
  const {
    checklistCompleted,
    checklistHidden,
    checklistAutoDetected,
    checklistProgress,
    completeTask,
    hideChecklistWidget,
    showChecklistWidget,
    executeAction,
    startGuidedMode,
    productTipsEnabled,
  } = useHelp();

  const [expanded, setExpanded] = useState(true);

  if (!productTipsEnabled) return null;

  if (checklistHidden) {
    return (
      <button
        onClick={showChecklistWidget}
        className="flex w-full items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground press"
      >
        <EyeOff size={16} />
        Toon aan-de-slag checklist
      </button>
    );
  }

  if (checklistProgress.percentage >= 100) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
            <Check size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Checklist voltooid</p>
            <p className="text-xs text-muted">Je profiel is compleet.</p>
          </div>
          <button
            onClick={hideChecklistWidget}
            className="text-muted transition-colors hover:text-foreground"
            aria-label="Verbergen"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex-1">
          <p className="text-sm font-semibold">Maak je Vynta-profiel compleet</p>
          <p className="mt-0.5 text-xs text-muted">
            {checklistProgress.done} van {checklistProgress.total} · {checklistProgress.percentage}%
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="grid h-7 w-7 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            aria-label={expanded ? "Inklappen" : "Uitklappen"}
          >
            <ChevronRight
              size={16}
              className={cn("transition-transform", expanded && "rotate-90")}
            />
          </button>
          <button
            onClick={hideChecklistWidget}
            className="grid h-7 w-7 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            aria-label="Verbergen"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-surface-2">
        <div
          className="h-full bg-brand transition-all duration-500"
          style={{ width: `${checklistProgress.percentage}%` }}
        />
      </div>

      {/* Tasks */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="divide-y divide-border">
              {CHECKLIST_TASKS.map((task) => {
                const isDone =
                  checklistCompleted.has(task.id) ||
                  (task.detectKey && checklistAutoDetected[task.detectKey]);
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-3 p-3 transition-colors",
                      isDone && "opacity-50"
                    )}
                  >
                    <div
                      className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-all",
                        isDone
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-border"
                      )}
                    >
                      {isDone && <Check size={14} className="text-emerald-600" />}
                    </div>
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        isDone ? "text-muted line-through" : "text-foreground"
                      )}
                    >
                      {task.label}
                    </span>
                    {!isDone && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => executeAction(task.actionId)}
                          className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-surface-3 press"
                        >
                          Start
                        </button>
                        {task.tourId && (
                          <button
                            onClick={() => startGuidedMode(task.tourId!)}
                            className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-surface-2 press"
                          >
                            <Play size={10} />
                            Laat het mij zien
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
