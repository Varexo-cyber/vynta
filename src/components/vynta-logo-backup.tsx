"use client";

import { ThemedLogo } from "./themed-logo";

/**
 * Backup of the original static Vynta logo component.
 * Kept untouched so it can be restored immediately when needed.
 */

export function VyntaLogoBackup({ height = 40 }: { height?: number }) {
  return (
    <ThemedLogo height={height} fallbackSrc="/logo.png" />
  );
}
