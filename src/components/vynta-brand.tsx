"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function VyntaMark({
  size = 38,
  className,
  src = "/logo.png",
}: {
  size?: number;
  className?: string;
  src?: string;
}) {
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-[10px]", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        sizes={`${size}px`}
        priority
        unoptimized
        className="h-full w-full scale-[1.6] object-cover"
      />
    </span>
  );
}

export function VyntaBrand({
  href = "/",
  size = 38,
  className,
  textClassName,
  markSrc,
}: {
  href?: string;
  size?: number;
  className?: string;
  textClassName?: string;
  markSrc?: string;
}) {
  return (
    <Link href={href} className={cn("group inline-flex items-center", className)} aria-label="Vynta homepage">
      <motion.span
        className="inline-flex items-center gap-1.5"
        whileHover={{ y: -3, scale: 1.04, rotate: -0.7 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
      >
        <VyntaMark size={size} src={markSrc} />
        <span className={cn("font-bold leading-none tracking-[-0.04em]", textClassName)} style={{ fontSize: Math.max(16, size * 0.45) }}>
          ynta
        </span>
      </motion.span>
    </Link>
  );
}
