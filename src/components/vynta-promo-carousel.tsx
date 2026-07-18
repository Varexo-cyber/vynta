"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "./app-store";
import type { PostType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ThemedLogo } from "./themed-logo";

type SlideAction = "composer" | "networks" | "national";

interface Slide {
  id: string;
  title: string;
  body: string;
  secondary: string;
  cta: string;
  action: SlideAction;
  type?: PostType;
  visual: React.ElementType;
  accent: string;
}

/* ---------------- Consistent visual language ---------------- */

const ORANGE = "text-orange-500";
const ORANGE_BG = "bg-orange-500";
const ORANGE_RING = "ring-orange-500/30";

function Node({
  children,
  size = "md",
  accent = false,
  pulse = false,
}: {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  accent?: boolean;
  pulse?: boolean;
}) {
  const sizeClasses = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" };
  return (
    <div className="relative">
      {pulse && (
        <motion.div
          animate={{ opacity: [0, 0.35, 0], scale: [0.9, 1.5, 1.9] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
          className={cn("absolute inset-0 rounded-full", ORANGE_BG)}
        />
      )}
      <div
        className={cn(
          "relative z-10 grid place-items-center rounded-full bg-surface shadow-sm ring-1 ring-border",
          accent ? cn("ring-2", ORANGE_RING) : "",
          sizeClasses[size]
        )}
      >
        {children}
      </div>
    </div>
  );
}

function NetworkLine({ d, delay = 0, duration = 1.8 }: { d: string; delay?: number; duration?: number }) {
  return (
    <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
      <motion.path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.35"
        className="text-orange-500/30"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration, delay, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
      />
    </svg>
  );
}

function TravelingDot({ path, delay = 0, duration = 2.5 }: { path: string; delay?: number; duration?: number }) {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <motion.circle
        r="1.6"
        className="fill-orange-500"
        initial={{ offsetDistance: "0%" }}
        animate={{ offsetDistance: "100%" }}
        transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
      >
        <animateMotion dur={`${duration}s`} begin={`${delay}s`} repeatCount="indefinite" path={path} />
      </motion.circle>
    </svg>
  );
}

function FloatingParticle({ x, y, delay = 0 }: { x: string; y: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: [0, 0.6, 0], y: [-6, 6, -6] }}
      transition={{ duration: 4, delay, repeat: Infinity, ease: "easeInOut" }}
      className="absolute h-1.5 w-1.5 rounded-full bg-orange-500/60"
      style={{ left: x, top: y }}
    />
  );
}

function NetworkField() {
  const points = [
    { x: 18, y: 28, id: "p1" },
    { x: 82, y: 32, id: "p2" },
    { x: 74, y: 72, id: "p3" },
    { x: 28, y: 78, id: "p4" },
    { x: 50, y: 14, id: "p5" },
    { x: 88, y: 58, id: "p6" },
    { x: 14, y: 52, id: "p7" },
  ];
  const center = { x: 50, y: 50 };
  const lines = points.map((p) => `M ${p.x} ${p.y} L ${center.x} ${center.y}`);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Expanding reach rings */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-500/10"
          style={{ width: 70 + i * 34, height: 70 + i * 34 }}
          animate={{ opacity: [0, 0.18, 0], scale: [0.75, 1.45] }}
          transition={{ duration: 4, delay: i * 1, repeat: Infinity, ease: "easeOut" }}
        />
      ))}

      {/* Connection lines drawing in and out */}
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        {lines.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.35"
            className="text-orange-500/20"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 0.45, 0.45, 0] }}
            transition={{ duration: 3.2, delay: i * 0.35, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </svg>

      {/* Small particles traveling between businesses */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {points.map((p, i) => (
          <motion.circle
            key={p.id}
            r="1.2"
            className="fill-orange-500/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2.6, delay: i * 0.35, repeat: Infinity, ease: "linear" }}
          >
            <animateMotion dur={`${2.6}s`} begin={`${i * 0.35}s`} repeatCount="indefinite" path={`M ${p.x} ${p.y} L ${center.x} ${center.y}`} />
          </motion.circle>
        ))}
      </svg>

      {/* Pulsing map points */}
      {points.map((p, i) => (
        <motion.div
          key={p.id}
          className="absolute h-2 w-2 rounded-full bg-orange-500/60"
          style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)" }}
          animate={{ opacity: [0.35, 0.9, 0.35], scale: [1, 1.35, 1] }}
          transition={{ duration: 2.4, delay: i * 0.35, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Floating content cards */}
      {[
        { x: "14%", y: "24%", delay: 0 },
        { x: "74%", y: "22%", delay: 1.2 },
        { x: "76%", y: "70%", delay: 2.4 },
        { x: "12%", y: "72%", delay: 3.6 },
      ].map((c, i) => (
        <motion.div
          key={i}
          className="absolute rounded-lg bg-surface/80 p-1.5 shadow-sm ring-1 ring-border/60 backdrop-blur-sm"
          style={{ left: c.x, top: c.y }}
          animate={{ y: [-4, 4, -4], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 5, delay: c.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="h-1.5 w-6 rounded bg-foreground/15" />
        </motion.div>
      ))}
    </div>
  );
}

function SearchVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500/[0.06] to-transparent" />
      <NetworkField />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <div
          key={deg}
          className="absolute h-1.5 w-1.5 rounded-full bg-foreground/40"
          style={{ transform: `rotate(${deg}deg) translateX(52px)` }}
        />
      ))}
      <NetworkLine d="M50 50 L50 8 M50 50 L14 25 M50 50 L86 25 M50 50 L14 75 M50 50 L86 75 M50 50 L50 92" />
      <TravelingDot path="M50 8 L50 50" delay={0} />
      <TravelingDot path="M14 25 L50 50" delay={0.4} />
      <TravelingDot path="M86 25 L50 50" delay={0.8} />
      <TravelingDot path="M14 75 L50 50" delay={1.2} />
      <TravelingDot path="M86 75 L50 50" delay={1.6} />
      <TravelingDot path="M50 92 L50 50" delay={2} />
      <FloatingParticle x="20%" y="30%" delay={0} />
      <FloatingParticle x="75%" y="25%" delay={1.2} />
      <FloatingParticle x="70%" y="70%" delay={2.4} />
      <Node size="lg" accent pulse>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={ORANGE} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </Node>
    </div>
  );
}

function NationalVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500/[0.05] to-transparent" />
      <NetworkField />
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0, 0.3, 0], scale: [0.7, 1.3, 1.7] }}
          transition={{ duration: 4, delay: i * 0.8, repeat: Infinity, ease: "easeOut" }}
          className="absolute rounded-full border border-orange-500/20"
          style={{ width: 70 + i * 34, height: 70 + i * 34 }}
        />
      ))}
      {[
        { cx: 28, cy: 35 },
        { cx: 70, cy: 42 },
        { cx: 55, cy: 68 },
        { cx: 32, cy: 72 },
      ].map((p, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 0.9, 0.3], scale: [1, 1.3, 1] }}
          transition={{ duration: 2.2, delay: i * 0.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute h-2 w-2 rounded-full bg-orange-500/70"
          style={{ left: `${p.cx}%`, top: `${p.cy}%`, transform: "translate(-50%, -50%)" }}
        />
      ))}
      <NetworkLine d="M50 50 L28 35 M50 50 L70 42 M50 50 L55 68 M50 50 L32 72" delay={0.3} duration={2.2} />
      <TravelingDot path="M28 35 L50 50" delay={0.2} duration={2} />
      <TravelingDot path="M70 42 L50 50" delay={0.7} duration={2} />
      <TravelingDot path="M55 68 L50 50" delay={1.2} duration={2} />
      <TravelingDot path="M32 72 L50 50" delay={1.7} duration={2} />
      <Node size="lg" accent pulse>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={ORANGE} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </Node>
    </div>
  );
}

function PeopleVisual() {
  const nodes = [
    { x: 50, y: 30, accent: true },
    { x: 22, y: 55, accent: false },
    { x: 78, y: 55, accent: false },
    { x: 36, y: 82, accent: false },
    { x: 64, y: 82, accent: false },
  ];
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500/[0.05] to-transparent" />
      <NetworkField />
      <NetworkLine d="M50 30 L22 55 M50 30 L78 55 M22 55 L36 82 M78 55 L64 82 M36 82 L64 82" delay={0.2} duration={2} />
      <TravelingDot path="M22 55 L50 30" delay={0.2} duration={1.8} />
      <TravelingDot path="M78 55 L50 30" delay={0.7} duration={1.8} />
      <TravelingDot path="M36 82 L22 55" delay={1.1} duration={1.8} />
      <TravelingDot path="M64 82 L78 55" delay={1.5} duration={1.8} />
      <FloatingParticle x="15%" y="35%" delay={0.5} />
      <FloatingParticle x="80%" y="70%" delay={1.7} />
      {nodes.map((n, i) => (
        <div
          key={i}
          className="absolute"
          style={{ left: `${n.x}%`, top: `${n.y}%`, transform: "translate(-50%, -50%)" }}
        >
          <Node size="sm" accent={n.accent} pulse={n.accent}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={n.accent ? ORANGE : "text-foreground/60"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Node>
        </div>
      ))}
    </div>
  );
}

function ProductsVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500/[0.05] to-transparent" />
      <NetworkField />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M -10 55 Q 50 25 110 55" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-orange-500/25" />
        <path d="M -10 55 Q 50 85 110 55" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-orange-500/25" />
      </svg>
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ x: -90, opacity: 0 }}
          animate={{ x: 190, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 4, delay: i * 1, repeat: Infinity, ease: "linear" }}
          className="absolute flex h-12 w-16 items-center justify-center rounded-lg bg-surface shadow-sm ring-1 ring-border"
          style={{ top: `${22 + i * 16}%` }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={i === 1 ? ORANGE : "text-foreground/50"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18" />
          </svg>
        </motion.div>
      ))}
      <TravelingDot path="M -10 55 Q 50 25 110 55" delay={0} duration={3.5} />
      <TravelingDot path="M -10 55 Q 50 85 110 55" delay={1.2} duration={3.5} />
      <FloatingParticle x="25%" y="30%" delay={0} />
      <FloatingParticle x="65%" y="75%" delay={2} />
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-surface to-transparent" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-surface to-transparent" />
    </div>
  );
}

function NetworkVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500/[0.05] to-transparent" />
      <NetworkField />
      {[0, 72, 144, 216, 288].map((deg) => (
        <div
          key={deg}
          className="absolute h-1.5 w-1.5 rounded-full bg-foreground/40"
          style={{ transform: `rotate(${deg}deg) translateX(54px)` }}
        />
      ))}
      <NetworkLine d="M50 50 L50 10 M50 50 L17 28 M50 50 L83 28 M50 50 L17 72 M50 50 L83 72 M50 50 L50 90" delay={0.2} duration={2} />
      <TravelingDot path="M50 10 L50 50" delay={0} duration={1.8} />
      <TravelingDot path="M17 28 L50 50" delay={0.35} duration={1.8} />
      <TravelingDot path="M83 28 L50 50" delay={0.7} duration={1.8} />
      <TravelingDot path="M17 72 L50 50" delay={1.05} duration={1.8} />
      <TravelingDot path="M83 72 L50 50" delay={1.4} duration={1.8} />
      <TravelingDot path="M50 90 L50 50" delay={1.75} duration={1.8} />
      <FloatingParticle x="18%" y="25%" delay={0.3} />
      <FloatingParticle x="78%" y="75%" delay={1.5} />
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0, 0.2, 0], scale: [0.8, 1.25, 1.6] }}
          transition={{ duration: 3, delay: i * 0.75, repeat: Infinity, ease: "easeOut" }}
          className="absolute rounded-full border border-orange-500/20"
          style={{ width: 60 + i * 30, height: 60 + i * 30 }}
        />
      ))}
      <Node size="lg" accent pulse>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={ORANGE} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="3" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="18" r="3" />
          <path d="M6 15v-2a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v2" />
        </svg>
      </Node>
    </div>
  );
}

function PostVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500/[0.05] to-transparent" />
      <NetworkField />
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0, 0.2, 0], scale: [1, 1.7, 2.3] }}
          transition={{ duration: 3.5, delay: i * 1.1, repeat: Infinity, ease: "easeOut" }}
          className="absolute rounded-full border border-orange-500/15"
          style={{ width: 110 + i * 36, height: 110 + i * 36 }}
        />
      ))}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 w-44 rounded-xl bg-surface p-3 shadow-md ring-1 ring-border"
      >
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-orange-500/20" />
          <div className="h-1.5 w-16 rounded bg-foreground/15" />
        </div>
        <div className="mt-2.5 space-y-1.5">
          <div className="h-1.5 w-full rounded bg-foreground/10" />
          <div className="h-1.5 w-4/5 rounded bg-foreground/10" />
          <div className="h-1.5 w-2/3 rounded bg-foreground/10" />
        </div>
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          <span className="h-1.5 w-12 rounded bg-foreground/10" />
        </div>
      </motion.div>
      <FloatingParticle x="22%" y="25%" delay={0} />
      <FloatingParticle x="72%" y="70%" delay={1.8} />
      <motion.div
        animate={{ opacity: [0, 0.8, 0], scale: [0.8, 1.2, 0.8], x: [0, 30, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[20%] top-[25%] h-2 w-2 rounded-full bg-orange-500/60"
      />
    </div>
  );
}

const SLIDES: Slide[] = [
  {
    id: "sourcing",
    title: "Vind sneller de juiste leverancier",
    body: "Plaats je aanvraag direct in je gemeente, provincie en sector.",
    secondary: "Bereik relevante Nederlandse bedrijven",
    cta: "Plaats een aanvraag",
    action: "composer",
    type: "question",
    visual: SearchVisual,
    accent: "from-surface-2 to-surface",
  },
  {
    id: "national",
    title: "Word zichtbaar in heel Nederland",
    body: "Vergroot je bereik verder dan je eigen regio.",
    secondary: "Bereik landelijke bedrijven",
    cta: "Ontdek Heel Nederland",
    action: "national",
    visual: NationalVisual,
    accent: "from-surface-2 to-surface",
  },
  {
    id: "hiring",
    title: "Vind talent in jouw sector",
    body: "Deel je vacature met de juiste mensen in jouw regio.",
    secondary: "Bereik werkzoekenden en bedrijven",
    cta: "Plaats een vacature",
    action: "composer",
    type: "hiring",
    visual: PeopleVisual,
    accent: "from-surface-2 to-surface",
  },
  {
    id: "offer",
    title: "Verkoop je voorraad of capaciteit",
    body: "Promoot beschikbare producten, voorraad of diensten.",
    secondary: "Direct zichtbaar voor afnemers",
    cta: "Plaats een aanbod",
    action: "composer",
    type: "offer",
    visual: ProductsVisual,
    accent: "from-surface-2 to-surface",
  },
  {
    id: "network",
    title: "Bouw je lokale netwerk uit",
    body: "Ontdek bedrijven in je gemeente, provincie en branche.",
    secondary: "Automatisch verbonden",
    cta: "Bekijk netwerken",
    action: "networks",
    visual: NetworkVisual,
    accent: "from-surface-2 to-surface",
  },
  {
    id: "post",
    title: "Deel je eerste bericht",
    body: "Plaats een update en start het gesprek in je netwerk.",
    secondary: "Zichtbaar voor je volgers",
    cta: "Plaats een bericht",
    action: "composer",
    type: "update",
    visual: PostVisual,
    accent: "from-surface-2 to-surface",
  },
];

const SWIPE_THRESHOLD = 40;

export function VyntaPromoCarousel({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "inline";
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);
  const { setCreateOpen, setCreateType, networks } = useApp();
  const router = useRouter();

  const isInline = variant === "inline";

  const next = useCallback(() => {
    setDirection(1);
    setIndex((i) => (i + 1) % SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  const goTo = (i: number) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  };

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [paused, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  const handleCta = (slide: Slide) => {
    if (slide.action === "composer") {
      if (slide.type) setCreateType(slide.type);
      setCreateOpen(true);
    } else if (slide.action === "networks") {
      router.push("/networks");
    } else if (slide.action === "national") {
      const national = networks.find((n) => n.type === "national");
      if (national) router.push(`/networks/${national.id}`);
      else router.push("/networks");
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current == null) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) next();
      else prev();
    }
    touchStartRef.current = null;
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  };

  const currentSlide = SLIDES[index];
  const Visual = currentSlide.visual;

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-surface to-surface-2 text-foreground shadow-lg transition-shadow duration-500 dark:shadow-[0_0_50px_-16px_rgba(249,115,22,0.22)]",
        isInline ? "my-4" : "w-full"
      )}
      style={{ minHeight: isInline ? 460 : 540 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="Vynta promoties"
    >
      {/* Soft ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-foreground/[0.025] blur-3xl dark:bg-orange-500/10" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-foreground/[0.025] blur-3xl dark:bg-orange-500/5" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-foreground/[0.01] to-foreground/[0.03] dark:via-orange-500/[0.01] dark:to-orange-500/[0.02]" />
      </div>

      {/* Vynta logo header — fixed wrapper for both themes */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-[7px]">
        <Link href="/feed" className="flex items-center gap-0">
          <span className="flex h-[48px] w-[72px] shrink-0 items-center justify-center overflow-hidden">
            <ThemedLogo height={48} fallbackSrc="/logo.png" className="dark:drop-shadow-[0_0_18px_rgba(249,115,22,0.35)]" />
          </span>
          <span className="-ml-3 mt-[2px] text-[16px] font-semibold">ynta</span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={prev}
            className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus:outline-none focus:ring-1 focus:ring-border-strong"
            aria-label="Vorige slide"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus:outline-none focus:ring-1 focus:ring-border-strong"
            aria-label="Volgende slide"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Slides — directly below logo header, minimal gap */}
      <div className="relative z-10 px-4 pb-5">
        <div className={cn("relative overflow-hidden rounded-2xl bg-gradient-to-b from-surface-2 via-surface to-orange-500/[0.03] p-1 ring-1 ring-border/50", isInline ? "h-[380px]" : "h-[480px]")}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Text area — directly at top, compact spacing */}
              <div className="flex flex-col px-3 pt-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{currentSlide.secondary}</p>
                <h3 className="mt-1 text-[22px] font-semibold leading-tight tracking-tight">{currentSlide.title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{currentSlide.body}</p>
              </div>

              {/* Visual area — below text */}
              <div className={cn("relative w-full overflow-hidden rounded-xl bg-gradient-to-b from-foreground/[0.04] to-transparent", isInline ? "h-[140px]" : "h-[180px]")}>
                <Visual />
              </div>

              {/* CTA at bottom */}
              <div className="mt-auto px-3 pb-3 pt-3">
                <button
                  onClick={() => handleCta(currentSlide)}
                  className="w-full rounded-full border border-border bg-surface py-3 text-[15px] font-semibold text-foreground transition-all hover:bg-foreground hover:text-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface"
                >
                  {currentSlide.cta}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-border">
            <div
              key={currentSlide.id}
              className={cn(
                "absolute inset-y-0 left-0 w-full rounded-full bg-orange-500",
                paused ? "[animation-play-state:paused]" : "[animation-play-state:running]"
              )}
              style={{ animation: "vyntaProgress 4s linear forwards" }}
            />
          </div>
          <style>{`
            @keyframes vyntaProgress {
              from { width: 0%; }
              to { width: 100%; }
            }
          `}</style>
          <div className="flex items-center gap-1.5">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                className={cn(
                  "h-2 w-2 rounded-full transition-all focus:outline-none focus:ring-1 focus:ring-border-strong",
                  i === index ? "bg-foreground" : "bg-border hover:bg-border-strong"
                )}
                aria-label={`Ga naar slide ${i + 1}`}
                aria-current={i === index ? "true" : "false"}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
