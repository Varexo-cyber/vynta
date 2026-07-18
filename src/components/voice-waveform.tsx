"use client";

import { useMemo, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

export function VoiceWaveform({
  samples,
  progress = 0,
  barCount = 48,
  scrolling = false,
  inactiveColor = "var(--voice-received-wave)",
  activeColor = "var(--voice-received-wave-active)",
  onSeek,
  className,
}: {
  samples: number[];
  progress?: number;
  barCount?: number;
  scrolling?: boolean;
  inactiveColor?: string;
  activeColor?: string;
  onSeek?: (fraction: number) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const bars = useMemo(() => {
    if (samples.length === 0) {
      const seed = 42;
      const result: number[] = [];
      for (let i = 0; i < barCount; i++) {
        const x = Math.sin((i + seed) * 0.5) * Math.cos((i + seed) * 0.3);
        result.push(Math.max(0.15, Math.min(0.85, 0.4 + x * 0.35)));
      }
      return result;
    }
    if (scrolling) {
      const tail = samples.slice(-barCount);
      const result = new Array(barCount).fill(0.12);
      for (let i = 0; i < tail.length; i++) {
        result[i] = Math.max(0.12, Math.min(1, tail[i]));
      }
      return result;
    }
    const result: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const idx = Math.floor((i / barCount) * samples.length);
      result.push(Math.max(0.12, Math.min(1, samples[Math.min(idx, samples.length - 1)])));
    }
    return result;
  }, [samples, barCount, scrolling]);

  const activeIndex = scrolling ? -1 : Math.max(0, Math.floor(progress * barCount));

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!onSeek || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(fraction);
  }, [onSeek]);

  return (
    <div
      ref={containerRef}
      className={cn("flex items-center justify-between gap-[2px]", onSeek && "cursor-pointer", className)}
      onClick={handleClick}
      role={onSeek ? "slider" : undefined}
      aria-label={onSeek ? "Audiopositie" : undefined}
      aria-valuenow={onSeek ? Math.round(progress * 100) : undefined}
      aria-valuemin={onSeek ? 0 : undefined}
      aria-valuemax={onSeek ? 100 : undefined}
      aria-hidden={onSeek ? undefined : "true"}
      tabIndex={onSeek ? 0 : undefined}
      onKeyDown={onSeek ? (e) => {
        if (e.key === "ArrowLeft") onSeek(Math.max(0, progress - 0.05));
        if (e.key === "ArrowRight") onSeek(Math.min(1, progress + 0.05));
      } : undefined}
    >
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[3px] shrink-0 rounded-full transition-[height] motion-reduce:transition-none"
          style={{
            height: `${Math.max(15, h * 100)}%`,
            backgroundColor: activeIndex >= 0 && i <= activeIndex ? activeColor : inactiveColor,
          }}
        />
      ))}
    </div>
  );
}
