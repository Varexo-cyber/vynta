"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useHelp } from "@/components/help/help-provider";
import { cn } from "@/lib/utils";

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function ProductTour() {
  const {
    activeTour,
    tourStepIndex,
    currentTourStep,
    nextTourStep,
    prevTourStep,
    endTour,
    guidedModeActive,
  } = useHelp();
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getVisibleTarget = useCallback((selector: string): HTMLElement | null => {
    const elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    return elements.find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }) ?? null;
  }, []);

  useEffect(() => {
    if (!currentTourStep) {
      queueMicrotask(() => setTargetRect(null));
      return;
    }

    let observedTarget: HTMLElement | null = null;
    let advanced = false;

    const advanceAfterAction = () => {
      if (!currentTourStep.waitForAction || advanced) return;
      advanced = true;
      // Let the clicked link/button finish its own React/Next.js handler first.
      // Advancing synchronously during capture can unmount the target before
      // the navigation handler receives the event.
      window.setTimeout(nextTourStep, 0);
    };

    const observeTarget = (target: HTMLElement | null) => {
      if (observedTarget === target) return;
      if (observedTarget) {
        observedTarget.removeEventListener("click", advanceAfterAction, true);
        observedTarget.removeEventListener("input", advanceAfterAction, true);
        observedTarget.removeEventListener("change", advanceAfterAction, true);
      }
      observedTarget = target;
      if (observedTarget) {
        observedTarget.addEventListener("click", advanceAfterAction, true);
        observedTarget.addEventListener("input", advanceAfterAction, true);
        observedTarget.addEventListener("change", advanceAfterAction, true);
      }
    };

    const updateRect = () => {
      const liveTarget = getVisibleTarget(currentTourStep.selector);
      observeTarget(liveTarget);
      if (liveTarget) {
        const rect = liveTarget.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setTargetRect(null);
      }
    };

    const initialTarget = getVisibleTarget(currentTourStep.selector);
    initialTarget?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    requestAnimationFrame(updateRect);
    pollRef.current = setInterval(updateRect, 250);

    return () => {
      observeTarget(null);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [currentTourStep, getVisibleTarget, nextTourStep]);

  const handleNext = useCallback(() => {
    if (tourStepIndex >= (activeTour?.steps.length ?? 1) - 1) {
      endTour(true);
      return;
    }
    nextTourStep();
  }, [activeTour, tourStepIndex, nextTourStep, endTour]);

  if (!activeTour || !currentTourStep) return null;

  const isLastStep = tourStepIndex >= activeTour.steps.length - 1;
  const padding = 8;
  const popoverWidth = Math.min(340, window.innerWidth - 32);
  const estimatedPopoverHeight = 230;
  const preferredTop = targetRect
    ? currentTourStep.placement === "top"
      ? targetRect.top - estimatedPopoverHeight - 16
      : targetRect.top + targetRect.height + padding + 12
    : 0;

  const popoverStyle: React.CSSProperties = targetRect
    ? {
        position: "fixed",
        top: Math.max(16, Math.min(preferredTop, window.innerHeight - estimatedPopoverHeight - 16)),
        left: Math.max(
          16,
          Math.min(
            targetRect.left + targetRect.width / 2 - popoverWidth / 2,
            window.innerWidth - popoverWidth - 16
          )
        ),
        maxWidth: `${popoverWidth}px`,
      }
    : {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: `${popoverWidth}px`,
      };

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-[80] bg-black/45"
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
            }}
          />
        )}
      </div>

      <AnimatePresence>
        <motion.div
          key={`${activeTour.id}-${tourStepIndex}`}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={popoverStyle}
          className="fixed z-[81] w-[340px] max-w-[calc(100vw-32px)] rounded-2xl border border-border bg-surface p-5 shadow-2xl"
          role="dialog"
          aria-label={currentTourStep.title}
        >
          <div className="mb-3 flex gap-1.5" aria-hidden>
            {activeTour.steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  index === tourStepIndex
                    ? "bg-brand"
                    : index < tourStepIndex
                      ? "bg-foreground/30"
                      : "bg-border"
                )}
              />
            ))}
          </div>

          <h3 className="text-base font-semibold tracking-tight">{currentTourStep.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{currentTourStep.description}</p>

          {guidedModeActive && currentTourStep.waitForAction && targetRect && (
            <p className="mt-2 text-xs font-medium text-brand">
              Tik op het gemarkeerde onderdeel. De uitleg gaat daarna automatisch verder.
            </p>
          )}
          {!targetRect && (
            <p className="mt-2 text-xs font-medium text-brand">
              Dit onderdeel staat op een andere pagina. Kies Volgende om verder te gaan.
            </p>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => endTour(false)}
              className="min-h-11 px-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Overslaan
            </button>
            <div className="flex items-center gap-2">
              {tourStepIndex > 0 && (
                <button
                  type="button"
                  onClick={prevTourStep}
                  className="grid h-11 w-11 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                  aria-label="Vorige stap"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-all hover:opacity-90 press"
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
