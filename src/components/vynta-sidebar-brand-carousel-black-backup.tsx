"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "./app-store";

const AUTO_INTERVAL = 4500;

function BrandVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
      </div>
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10"
      >
        <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg">
          <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
        </span>
        <span className="text-[18px] font-semibold tracking-tight text-white">Vynta</span>
        <motion.span
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.25, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-orange-500"
        />
      </motion.div>
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-40" viewBox="0 0 100 60">
        <motion.path
          d="M10 30 Q 30 20 50 30 T 90 30"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.4"
          className="text-orange-500/30"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
        />
        <motion.path
          d="M10 40 Q 30 50 50 40 T 90 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.3"
          className="text-white/20"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.2, delay: 0.4, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}

function LocalVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-black">
      <motion.div
        animate={{ opacity: [0, 0.2, 0], scale: [0.8, 1.4, 1.8] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
        className="absolute h-16 w-16 rounded-full border border-orange-500/20"
      />
      <div className="relative z-10 flex items-center gap-3">
        {[
          { x: 0, y: 0, delay: 0 },
          { x: 18, y: -10, delay: 0.4 },
          { x: -16, y: 10, delay: 0.8 },
        ].map((p, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-2 w-2 rounded-full bg-orange-500/80"
            style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
          />
        ))}
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="grid h-10 w-10 place-items-center rounded-full bg-orange-500/15 ring-1 ring-orange-500/30"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
        </motion.div>
      </div>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 60">
        <motion.path
          d="M50 30 L30 22 M50 30 L68 24 M50 30 L34 42"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.35"
          className="text-white/15"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.8, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}

function OpportunitiesVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-black">
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black to-transparent z-10" />
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 80, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3.5, delay: i * 0.9, repeat: Infinity, ease: "linear" }}
          className="absolute flex h-9 w-14 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10"
          style={{ top: `${20 + i * 22}%` }}
        >
          <span className="h-4 w-4 rounded-full bg-orange-500/30" />
        </motion.div>
      ))}
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-orange-500"
      />
    </div>
  );
}

function SectorVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-black">
      {[0, 72, 144, 216, 288].map((deg) => (
        <motion.div
          key={deg}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, delay: deg / 360, repeat: Infinity, ease: "easeInOut" }}
          className="absolute h-1.5 w-1.5 rounded-full bg-white/40"
          style={{ transform: `rotate(${deg}deg) translateX(30px)` }}
        />
      ))}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 60">
        <motion.path
          d="M50 30 L50 10 M50 30 L23 24 M50 30 L77 24 M50 30 L28 46 M50 30 L72 46"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.35"
          className="text-orange-500/25"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
        />
      </svg>
      <motion.div
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 grid h-10 w-10 place-items-center rounded-full bg-white/5 ring-1 ring-orange-500/30"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
      </motion.div>
    </div>
  );
}

function PostVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-black">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0, 0.25, 0], scale: [1, 1.7, 2.4] }}
          transition={{ duration: 3, delay: i * 0.9, repeat: Infinity, ease: "easeOut" }}
          className="absolute rounded-full border border-orange-500/15"
          style={{ width: 60 + i * 24, height: 60 + i * 24 }}
        />
      ))}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 w-32 rounded-lg bg-white/5 p-2.5 ring-1 ring-white/10"
      >
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-orange-500/20" />
          <div className="h-1 w-14 rounded bg-white/20" />
        </div>
        <div className="mt-2 space-y-1">
          <div className="h-1 w-full rounded bg-white/10" />
          <div className="h-1 w-3/4 rounded bg-white/10" />
        </div>
      </motion.div>
    </div>
  );
}

const SLIDES = [
  {
    id: "brand",
    visual: BrandVisual,
    title: "Vynta",
    body: "Het zakelijke netwerk van Nederland",
    action: undefined,
  },
  {
    id: "local",
    visual: LocalVisual,
    title: "Lokaal verbonden",
    body: "Ontdek bedrijven dichtbij",
    detail: "In je gemeente en provincie",
    action: undefined,
  },
  {
    id: "opportunities",
    visual: OpportunitiesVisual,
    title: "Zakelijke kansen",
    body: "Nieuwe kansen in je netwerk",
    detail: "Vraag, aanbod en samenwerking",
    action: undefined,
  },
  {
    id: "sector",
    visual: SectorVisual,
    title: "Branchenetwerken",
    body: "Vind bedrijven in jouw sector",
    detail: "Van bouw tot technologie",
    action: undefined,
  },
  {
    id: "post",
    visual: PostVisual,
    title: "Plaats en bereik",
    body: "Laat je bedrijf zien",
    detail: "Plaats een bericht in je netwerk",
    action: "Plaats bericht",
  },
];

export function VyntaSidebarBrandCarousel({
  onPostClick,
  className,
}: {
  onPostClick?: () => void;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);
  const reduced = useReducedMotion();
  const { setCreateOpen, setCreateType } = useApp();

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

  const handleAction = () => {
    if (onPostClick) {
      onPostClick();
      return;
    }
    setCreateType(null);
    setCreateOpen(true);
  };

  const current = SLIDES[index];
  const Visual = current.visual;

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 24 : -24, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -24 : 24, opacity: 0 }),
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={cn(
        "group relative mb-6 overflow-hidden rounded-2xl border border-white/10 bg-black text-white shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-orange-500",
        className
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Vynta brand"
    >
      <div className="relative h-[110px] w-full">
        <div className="absolute inset-0">
          <Visual />
        </div>
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={current.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduced ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black via-black/70 to-transparent p-3"
          >
            <div className="relative z-10">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-400">{current.body}</p>
              <h3 className="text-[15px] font-semibold leading-tight">{current.title}</h3>
              {current.detail && (
                <p className="mt-0.5 text-[11px] text-white/60">{current.detail}</p>
              )}
              {current.action && (
                <button
                  onClick={handleAction}
                  className="mt-2 inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-black transition-transform hover:scale-105"
                >
                  {current.action}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 px-3 py-2">
        <div className="flex items-center gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-orange-500",
                i === index ? "bg-orange-500" : "bg-white/25 hover:bg-white/50"
              )}
              aria-label={`Ga naar slide ${i + 1}`}
              aria-current={i === index ? "true" : "false"}
            />
          ))}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={prev}
            className="grid h-6 w-6 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Vorige slide"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={next}
            className="grid h-6 w-6 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Volgende slide"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
