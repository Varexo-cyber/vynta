"use client";

import Link from "next/link";
import { ThemedLogo } from "./themed-logo";

/**
 * Backup of the original desktop sidebar brand header.
 * Renders the static Vynta logo with the "ynta" text mark.
 * This component is intentionally kept unchanged for easy rollback.
 */
export function SidebarBrandBackup() {
  return (
    <Link href="/feed" className="mb-8 flex items-center gap-0 px-3">
      <span className="-ml-7 grid h-24 w-24 place-items-center overflow-hidden rounded-xl">
        <ThemedLogo height={64} fallbackSrc="/logo.png" className="h-full w-full object-contain dark:drop-shadow-[0_0_14px_rgba(255,255,255,0.35)]" />
      </span>
      <span className="-ml-6 mt-[7px] text-[16px] font-semibold">ynta</span>
    </Link>
  );
}
