"use client";

import { motion } from "framer-motion";
import { ThemedLogo } from "./themed-logo";

export function VyntaSidebarBrandCarousel({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={className}
    >
      <div className="relative flex items-center justify-center py-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="pointer-events-none absolute h-24 w-24 rounded-full bg-orange-500/10 blur-2xl"
        />
        <ThemedLogo
          height={90}
          fallbackSrc="/logo.png"
          alt="Vynta"
          className="relative z-10 h-auto w-[140px] object-contain"
        />
      </div>
    </div>
  );
}
