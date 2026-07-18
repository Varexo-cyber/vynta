"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const AUTO_INTERVAL = 5000;

const SLIDES = [
  { id: "brand", message: "Het zakelijke netwerk van Nederland" },
  { id: "local", message: "Ontdek bedrijven in jouw gemeente" },
  { id: "sector", message: "Vind kansen in jouw sector" },
  { id: "reach", message: "Plaats en bereik relevante bedrijven" },
  { id: "network", message: "Bouw je zakelijke netwerk" },
];

function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <motion.div
        animate={{ opacity: [0.3, 0.55, 0.3], scale: [1, 1.08, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-2xl"
      />
      <motion.div
        animate={{ x: [-40, 40, -40], opacity: [0, 0.08, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent"
        style={{ transform: "skewX(-12deg)" }}
      />
      {[
        { x: "18%", y: "28%", delay: 0 },
        { x: "78%", y: "34%", delay: 1.2 },
        { x: "22%", y: "68%", delay: 2.4 },
        { x: "74%", y: "72%", delay: 3.6 },
      ].map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 0.5, 0], y: [-4, 4, -4] }}
          transition={{ duration: 4, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
          className="absolute h-1 w-1 rounded-full bg-orange-500/60"
          style={{ left: p.x, top: p.y }}
        />
      ))}
      <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path
          d="M20 35 Q 40 25 60 35 T 85 35"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.35"
          className="text-orange-500/30"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
        />
        <motion.path
          d="M15 65 Q 35 75 55 65 T 80 65"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.3"
          className="text-foreground/10"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.5, delay: 0.6, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}

function BrandMark() {
  const [src, setSrc] = useState("/logoc.png");
  return (
    <div className="relative z-10 flex flex-col items-center justify-center">
      <div className="relative">
        <img
          src={src}
          alt="Vynta"
          className="h-[60px] w-auto object-contain"
          onError={() => setSrc("/logo.png")}
        />
        <motion.span
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.3, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-1 top-0 h-2 w-2 rounded-full bg-orange-500"
        />
      </div>
    </div>
  );
}

export function VyntaSidebarBrandCarousel({
  className,
}: {
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);
  const reduced = useReducedMotion();

  const next = useCallback(() => {
    setDirection(1);
    setIndex((i) => (i + 1) % SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  const goTo = useCallback((i: number) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  }, [index]);

  useEffect(() => {
    if (paused || reduced) return;
    const id = setInterval(next, AUTO_INTERVAL);
    return () => clearInterval(id);
  }, [paused, reduced, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    const node = containerRef.current;
    if (!node) return;
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [prev, next]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current == null) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 30) {
      if (diff > 0) next();
      else prev();
    }
    touchStartRef.current = null;
  };

  const current = SLIDES[index];

  const variants = {
    enter: (d: number) => ({ y: d > 0 ? 10 : -10, opacity: 0 }),
    center: { y: 0, opacity: 1 },
    exit: (d: number) => ({ y: d > 0 ? -10 : 10, opacity: 0 }),
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={cn(
        "group relative mb-8 flex h-[120px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-orange-500",
        className
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Vynta"
    >
      <AnimatedBackground />

      <div className="relative z-10 flex flex-col items-center px-3 pt-2">
        <BrandMark />
        <div className="relative mt-1 h-4 w-full text-center">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.p
              key={current.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: reduced ? 0 : 0.3, ease: "easeInOut" }}
              className="absolute inset-0 text-[11px] font-medium text-muted"
            >
              {current.message}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute bottom-2 left-0 right-0 z-10 flex items-center justify-center gap-2">
        <div className="flex items-center gap-1">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className={cn(
                "h-1 w-1 rounded-full transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-orange-500",
                i === index ? "bg-orange-500" : "bg-border hover:bg-border-strong"
              )}
              aria-label={`Ga naar slide ${i + 1}`}
              aria-current={i === index ? "true" : "false"}
            />
          ))}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={prev}
            className="grid h-5 w-5 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            aria-label="Vorige slide"
          >
            <ChevronLeft size={12} />
          </button>
          <button
            onClick={next}
            className="grid h-5 w-5 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            aria-label="Volgende slide"
          >
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
