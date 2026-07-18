"use client";

import { useState } from "react";
import { BadgeCheck, Star } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { POST_TYPES } from "@/lib/need-types";
import type { PostType } from "@/lib/types";

/* ---------------- Company Avatar ---------------- */
export function CompanyAvatar({
  name,
  color,
  logoUrl,
  website,
  size = 48,
  className,
}: {
  name: string;
  color: string;
  logoUrl?: string;
  website?: string;
  size?: number;
  className?: string;
}) {
  const src = logoUrl || (website ? logoFromWebsite(website) : undefined);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (src && !error) {
    return (
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full text-white shadow-sm ring-1 ring-black/5 transition-transform duration-200",
          className
        )}
        style={{ width: size, height: size, background: color }}
        aria-hidden
      >
        {!loaded && (
          <span className="absolute inset-0 grid place-items-center font-semibold" style={{ fontSize: Math.max(size * 0.35, 11) }}>
            {initials(name)}
          </span>
        )}
        <img
          src={src}
          alt={name}
          className={cn(
            "h-full w-full object-contain transition-opacity duration-200",
            loaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-white shadow-sm ring-1 ring-black/5 transition-transform duration-200",
        className
      )}
      style={{ width: size, height: size, background: color }}
      aria-hidden
    >
      <span className="font-semibold" style={{ fontSize: Math.max(size * 0.35, 11) }}>
        {initials(name)}
      </span>
    </div>
  );
}

function logoFromWebsite(website: string): string | undefined {
  try {
    const url = new URL(website.startsWith("http") ? website : `https://${website}`);
    const host = url.hostname.replace(/^www\./, "");
    if (!host.includes(".")) return undefined;
    return `https://logo.clearbit.com/${host}`;
  } catch {
    return undefined;
  }
}

/* ---------------- Verified Badge ---------------- */
export function VerifiedBadge({ size = 15 }: { size?: number }) {
  return (
    <BadgeCheck
      size={size}
      className="shrink-0"
      style={{ color: "var(--brand-purple)", fill: "color-mix(in srgb, var(--brand-purple) 14%, transparent)" }}
      aria-label="Verified"
    />
  );
}

/* ---------------- Rating ---------------- */
export function Rating({
  value,
  count,
  className,
}: {
  value: number;
  count?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <Star size={14} className="fill-amber-400 text-amber-400" />
      <span className="font-semibold tabular">{value.toFixed(1)}</span>
      {count != null && <span className="text-muted">({count})</span>}
    </span>
  );
}

/* ---------------- Post Type Badge ---------------- */
export function TypeBadge({
  type,
  size = "md",
}: {
  type: PostType;
  size?: "sm" | "md";
}) {
  const meta = POST_TYPES[type];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium text-muted",
        size === "sm" ? "text-[11px]" : "text-xs"
      )}
    >
      <Icon size={size === "sm" ? 11 : 13} strokeWidth={1.8} />
      {meta.label}
    </span>
  );
}

/* ---------------- Button ---------------- */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "accent";
  size?: "sm" | "md" | "lg";
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const isShiny = variant === "primary" || variant === "accent";
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background press",
        isShiny && "shimmer",
        size === "sm" && "h-9 px-4 text-sm",
        size === "md" && "h-10 px-5 text-sm",
        size === "lg" && "h-12 px-7 text-base",
        variant === "primary" &&
          "bg-foreground text-background hover:opacity-90",
        variant === "accent" &&
          "bg-brand text-brand-fg hover:opacity-90",
        variant === "secondary" &&
          "bg-surface-2 text-foreground hover:bg-surface-3",
        variant === "outline" &&
          "border border-border bg-transparent hover:border-border-strong hover:bg-surface-2",
        variant === "ghost" && "hover:bg-surface-2 text-foreground",
        className
      )}
      {...props}
    />
  );
}

/* ---------------- Pill ---------------- */
export function Pill({
  active,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 press",
        active
          ? "bg-foreground text-background ring-1 ring-inset ring-brand/25"
          : "border border-border bg-transparent text-muted hover:border-border-strong hover:text-foreground hover:bg-surface-2",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
