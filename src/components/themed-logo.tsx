"use client";

import { useTheme } from "./theme-provider";

export function ThemedLogo({
  height = 40,
  className,
  alt = "Vynta",
  fallbackSrc,
}: {
  height?: number;
  className?: string;
  alt?: string;
  fallbackSrc?: string;
}) {
  const { resolved } = useTheme();
  const src = resolved === "dark" ? "/logoaa.png" : "/logo.png";

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ height, width: "auto", display: "block", objectFit: "contain" }}
      onError={(e) => {
        if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
          e.currentTarget.src = fallbackSrc;
        }
      }}
    />
  );
}
