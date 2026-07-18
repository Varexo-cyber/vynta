"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useHelp } from "@/components/help/help-provider";
import { cn } from "@/lib/utils";

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function ProductTour() {
  const { activeTour, tourStepIndex, currentTourStep, nextTourStep, prevTourStep, endTour, guidedModeActive } = useHelp();
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
  const [waiting, setWaiting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const findTarget = useCallback((selector: string): ElementRect | null => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
  }, []);

  useEffect(() => {
    if (!currentTourStep) {
      setTargetRect(null);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    const updateRect = () => {
      const rect = findTarget(currentTourStep.selector);
      setTargetRect(rect);
    };

    updateRect();
    pollRef.current = setInterval(updateRect, 500);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [currentTourStep, findTarget]);

  const handleNext = useCallback(() => {
    if (guidedModeActive && currentTourStep?.waitForAction) {
      setWaiting(true);
      return;
    }
    nextTourStep();
  }, [guidedModeActive, currentTourStep, nextTourStep]);

  useEffect(() => {
    if (!waiting) return;
    const check = setInterval(() => {
      if (!activeTour || tourStepIndex >= activeTour.steps.length - 1) {
        setWaiting(false);
        endTour(true);
        return;
      }
      nextTourStep();
      setWaiting(false);
    }, 1500);
    return () => clearInterval(check);
  }, [waiting, activeTour, tourStepIndex, nextTourStep, endTour]);

  if (!activeTour || !currentTourStep) return null;

  const isLastStep = tourStepIndex >= activeTour.steps.length - 1;
  const padding = 8;

  const popoverStyle: React.CSSProperties = targetRect
    ? {
        position: "fixed",
        top: targetRect.top + targetRect.height + padding + 12,
        left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 360)),
        maxWidth: "340px",
      }
    : {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: "340px",
      };

  return (
    <>
      {/* Dim overlay with cutout */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[80]"
        style={{
          pointerEvents: "none",
          background: targetRect
            ? `rgba(0,0,0,0.45)`
            : `rgba(0,0,0,0.5)`,
        }}
        aria-hidden
      >
        {targetRect && (
          <div
            className="absolute rounded-xl ring-2 ring-brand transition-all duration-300"
            style={{
              top: targetRect.top - padding,
              left: targetRect.left - padding,
              width: targetRect.width + padding * 2,
              height: targetRect.height + padding * 2,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      {/* Popover */}
      <AnimatePresence>
        <motion.div
          key={`${activeTour.id}-${tourStepIndex}`}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={popoverStyle}
          className="fixed z-[81] w-[340px] max-w-[calc(100vw-32px)] rounded-2xl border border-border bg-surface p-5 shadow-2xl"
          role="dialog"
          aria-label={currentTourStep.title}
        >
          {/* Progress dots */}
          <div className="mb-3 flex gap-1.5">
            {activeTour.steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i === tourStepIndex ? "bg-brand" : i < tourStepIndex ? "bg-foreground/30" : "bg-border"
                )}
              />
            ))}
          </div>

          <h3 className="text-base font-semibold tracking-tight">{currentTourStep.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{currentTourStep.description}</p>

          {guidedModeActive && currentTourStep.waitForAction && (
            <p className="mt-2 text-xs font-medium text-brand">
              Wacht op jouw actie…
            </p>
          )}

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => endTour(false)}
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Overslaan
            </button>
            <div className="flex items-center gap-2">
              {tourStepIndex > 0 && (
                <button
                  onClick={prevTourStep}
                  className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                  aria-label="Vorige"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={waiting}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-40 press"
              >
                {isLastStep ? (
                  <>
                    Klaar <Check size={16} />
                  </>
                ) : (
                  <>
                    Volgende <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
