"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MousePointerClick,
} from "lucide-react";
import { useHelp } from "@/components/help/help-provider";
import { getHelpAction } from "@/lib/help-actions";
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
    executeAction,
  } = useHelp();
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
  const [transitionTarget, setTransitionTarget] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getVisibleTarget = useCallback((selector: string): HTMLElement | null => {
    const elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    const rendered = elements.filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden";
    });
    return (
      rendered.find((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.bottom > 0 &&
          rect.right > 0 &&
          rect.top < window.innerHeight &&
          rect.left < window.innerWidth
        );
      }) ??
      rendered[0] ??
      null
    );
  }, []);

  useEffect(() => {
    if (!currentTourStep) {
      queueMicrotask(() => {
        setTargetRect(null);
        setTransitionTarget(null);
      });
      return;
    }

    let observedTarget: HTMLElement | null = null;
    let advanced = false;

    const advanceAfterAction = (event: Event) => {
      if (!currentTourStep.waitForAction || advanced) return;
      advanced = true;
      const clickedElement =
        event.target instanceof Element ? event.target : observedTarget;
      const link =
        clickedElement?.closest<HTMLAnchorElement>("a[href]") ??
        observedTarget?.closest<HTMLAnchorElement>("a[href]");
      const href = link?.getAttribute("href");
      if (href) {
        const destination = new URL(href, window.location.href);
        const currentLocation = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        const nextLocation = `${destination.pathname}${destination.search}${destination.hash}`;
        if (
          destination.origin === window.location.origin &&
          nextLocation !== currentLocation
        ) {
          const nextStep = activeTour?.steps[tourStepIndex + 1];
          setTargetRect(null);
          setTransitionTarget(nextStep?.selector ?? currentTourStep.selector);
        }
      }
      if (activeTour) {
        try {
          sessionStorage.setItem(
            "vynta-active-tour",
            JSON.stringify({
              tourId: activeTour.id,
              step: Math.min(tourStepIndex + 1, activeTour.steps.length - 1),
              guided: guidedModeActive,
            }),
          );
        } catch {}
      }
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
        observedTarget.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
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
        const intersectsViewport =
          rect.bottom > 0 &&
          rect.right > 0 &&
          rect.top < window.innerHeight &&
          rect.left < window.innerWidth;
        setTargetRect(
          intersectsViewport
            ? {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              }
            : null,
        );
      } else {
        setTargetRect(null);
      }
    };

    requestAnimationFrame(updateRect);
    pollRef.current = setInterval(updateRect, 250);

    return () => {
      observeTarget(null);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [
    activeTour,
    currentTourStep,
    getVisibleTarget,
    guidedModeActive,
    nextTourStep,
    tourStepIndex,
  ]);

  useEffect(() => {
    if (!transitionTarget) return;

    if (targetRect && currentTourStep?.selector === transitionTarget) {
      const frame = requestAnimationFrame(() => setTransitionTarget(null));
      return () => cancelAnimationFrame(frame);
    }

    const timeout = window.setTimeout(() => setTransitionTarget(null), 15_000);
    return () => window.clearTimeout(timeout);
  }, [currentTourStep?.selector, targetRect, transitionTarget]);

  const handleNext = useCallback(() => {
    if (tourStepIndex >= (activeTour?.steps.length ?? 1) - 1) {
      endTour(true);
      return;
    }
    nextTourStep();
  }, [activeTour, tourStepIndex, nextTourStep, endTour]);

  if (!activeTour || !currentTourStep) return null;

  if (transitionTarget) {
    return (
      <>
        <div
          className="pointer-events-none fixed inset-0 z-[80] bg-black/55 backdrop-blur-[1px]"
          aria-hidden
        />
        <div className="pointer-events-none fixed inset-0 z-[81] grid place-items-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="pointer-events-auto w-full max-w-[340px] rounded-2xl border border-border bg-surface p-6 text-center shadow-2xl"
            role="status"
            aria-live="polite"
          >
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand">
              <LoaderCircle className="animate-spin" size={24} />
            </span>
            <h3 className="mt-4 text-base font-semibold tracking-tight">
              Pagina wordt geladen
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Een moment geduld. De volgende aanwijzing verschijnt zodra alles klaarstaat.
            </p>
            <button
              type="button"
              onClick={() => endTour(false)}
              className="mt-4 min-h-11 px-3 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Rondleiding stoppen
            </button>
          </motion.div>
        </div>
      </>
    );
  }

  const isLastStep = tourStepIndex >= activeTour.steps.length - 1;
  const waitsForAction = Boolean(currentTourStep.waitForAction);
  const recoveryAction = currentTourStep.actionId
    ? getHelpAction(currentTourStep.actionId)
    : undefined;
  const padding = 8;
  const popoverWidth = Math.min(340, window.innerWidth - 32);
  const estimatedPopoverHeight = waitsForAction ? 250 : 230;
  const viewportGap = 16;
  const targetGap = padding + 12;

  const positionPopover = (): React.CSSProperties => {
    if (!targetRect) {
      return {
        position: "fixed",
        top: Math.max(
          viewportGap,
          (window.innerHeight - estimatedPopoverHeight) / 2,
        ),
        left: Math.max(
          viewportGap,
          (window.innerWidth - popoverWidth) / 2,
        ),
        maxWidth: `${popoverWidth}px`,
      };
    }

    const roomAbove = targetRect.top - viewportGap;
    const roomBelow = window.innerHeight - targetRect.top - targetRect.height - viewportGap;
    const requestedTop = currentTourStep.placement === "top";
    const placeAbove = requestedTop
      ? roomAbove >= estimatedPopoverHeight + targetGap || roomBelow < roomAbove
      : roomBelow < estimatedPopoverHeight + targetGap && roomAbove > roomBelow;
    const top = placeAbove
      ? targetRect.top - estimatedPopoverHeight - targetGap
      : targetRect.top + targetRect.height + targetGap;

    return {
      position: "fixed",
      top: Math.max(
        viewportGap,
        Math.min(top, window.innerHeight - estimatedPopoverHeight - viewportGap),
      ),
      left: Math.max(
        viewportGap,
        Math.min(
          targetRect.left + targetRect.width / 2 - popoverWidth / 2,
          window.innerWidth - popoverWidth - viewportGap,
        ),
      ),
      maxWidth: `${popoverWidth}px`,
    };
  };

  const popoverStyle = positionPopover();
  const targetLabelStyle: React.CSSProperties | undefined = targetRect
    ? {
        position: "fixed",
        top:
          targetRect.top > 64
            ? targetRect.top - padding - 46
            : Math.min(
                targetRect.top + targetRect.height + padding + 12,
                window.innerHeight - 44,
              ),
        left: Math.max(
          12,
          Math.min(
            targetRect.left + targetRect.width / 2 - 54,
            window.innerWidth - 120,
          ),
        ),
      }
    : undefined;

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-[80]"
        aria-hidden
      >
        {targetRect ? (
          <motion.div
            initial={{ opacity: 0.7 }}
            animate={{ opacity: [0.82, 1, 0.82] }}
            transition={{ duration: 1.25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute rounded-xl"
            style={{
              top: targetRect.top - padding,
              left: targetRect.left - padding,
              width: targetRect.width + padding * 2,
              height: targetRect.height + padding * 2,
              border: "3px solid #ff603d",
              boxShadow:
                "0 0 0 7px rgba(255,96,61,0.28), 0 0 28px rgba(255,96,61,0.72), 0 0 0 9999px rgba(0,0,0,0.58)",
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-black/45" />
        )}
      </div>

      {targetRect && targetLabelStyle && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={targetLabelStyle}
          className="pointer-events-none fixed z-[82] inline-flex h-9 items-center gap-1.5 rounded-full bg-[#ff603d] px-3 text-xs font-bold text-white shadow-[0_8px_24px_rgba(255,96,61,0.42)]"
          aria-hidden
        >
          <MousePointerClick size={15} />
          Druk hier
        </motion.div>
      )}

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

          {waitsForAction && targetRect && (
            <p className="mt-2 text-xs font-medium text-brand">
              Druk op het oranje gemarkeerde onderdeel. De volgende stap verschijnt daarna vanzelf.
            </p>
          )}
          {!targetRect && (
            <p className="mt-2 text-xs font-medium text-brand">
              {recoveryAction
                ? "Dit onderdeel staat op een ander scherm. Druk op de oranje knop om daar verder te gaan."
                : "Dit onderdeel is nog niet zichtbaar. Rond de vorige stap af of ga één stap terug."}
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
              {waitsForAction ? (
                !targetRect &&
                recoveryAction &&
                currentTourStep.actionId && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextStep = activeTour.steps[tourStepIndex + 1];
                      setTargetRect(null);
                      setTransitionTarget(
                        currentTourStep.completeOnRecovery
                          ? nextStep?.selector ?? currentTourStep.selector
                          : currentTourStep.selector,
                      );
                      executeAction(currentTourStep.actionId!);
                      if (currentTourStep.completeOnRecovery) {
                        window.setTimeout(nextTourStep, 0);
                      }
                    }}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-brand-fg shadow-[0_8px_24px_rgba(255,96,61,0.3)] transition-all hover:brightness-105 press"
                  >
                    {recoveryAction.label} <ChevronRight size={16} />
                  </button>
                )
              ) : (
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
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
