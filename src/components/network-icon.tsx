"use client";

import { Globe, Map, MapPin, Building2 } from "lucide-react";
import type { NetworkType } from "@/lib/types";

const ICONS: Record<NetworkType, typeof Globe> = {
  municipality: MapPin,
  province: Map,
  industry: Building2,
  national: Globe,
};

export function NetworkIcon({ kind, size = 20, className }: { kind: NetworkType | string; size?: number; className?: string }) {
  const Icon = ICONS[kind as NetworkType] || Globe;
  return <Icon size={size} strokeWidth={1.8} className={className} />;
}
