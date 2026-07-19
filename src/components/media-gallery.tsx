"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, FileText, Play, Video as VideoIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PostAttachment } from "@/lib/types";

const reducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function resolveAttachmentUrl(url: string): string {
  if (url.startsWith("/uploads/")) {
    return url.replace("/uploads/", "/api/uploads/");
  }
  if (url.startsWith("/api/storage/")) {
    return url;
  }
  return url;
}

function isLegacyUpload(url: string): boolean {
  return url.startsWith("/uploads/") && !url.startsWith("/api/");
}

/* ------------------------------------------------------------------ */
/* Single attachment — exact the original working carousel             */
/* ------------------------------------------------------------------ */

export function MediaGallery({
  attachments,
  onDoubleLike,
}: {
  attachments: PostAttachment[];
  onDoubleLike?: (x: number, y: number) => void;
}) {
  const total = attachments.length;

  if (total === 0) return null;

  if (total === 1) {
    return <SingleMedia attachment={attachments[0]} onDoubleLike={onDoubleLike} />;
  }

  return (
    <MultiAttachmentCollage attachments={attachments} onDoubleLike={onDoubleLike} />
  );
}

function SingleMedia({
  attachment,
  onDoubleLike,
}: {
  attachment: PostAttachment;
  onDoubleLike?: (x: number, y: number) => void;
}) {
  return (
    <div
      className="mx-auto mt-4 w-fit max-w-full overflow-hidden rounded-2xl"
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest("video, button, a, [data-no-like]"))
          return;
        const rect = e.currentTarget.getBoundingClientRect();
        onDoubleLike?.(e.clientX - rect.left, e.clientY - rect.top);
      }}
    >
      <GalleryItem attachment={attachment} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Multi-attachment collage (preview only, no native video player)     */
/* ------------------------------------------------------------------ */

function sortAttachments(items: PostAttachment[]) {
  return [...items].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.position - b.position;
  });
}

function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function MultiAttachmentCollage({
  attachments,
  onDoubleLike,
}: {
  attachments: PostAttachment[];
  onDoubleLike?: (x: number, y: number) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sorted = useMemo(() => sortAttachments(attachments), [attachments]);
  const total = sorted.length;
  const visible = total <= 4 ? sorted : sorted.slice(0, 4);
  const extra = total - 4;

  const count = visible.length;

  const gridClass =
    count === 2
      ? "grid grid-cols-2 sm:grid-cols-[1.25fr_1fr]"
      : count === 3
      ? "grid grid-cols-[1.5fr_1fr] grid-rows-2 aspect-[3/2]"
      : "grid grid-cols-2 grid-rows-2";

  return (
    <>
      <div className="mt-4 w-full">
        <div className="mx-auto overflow-hidden rounded-2xl bg-surface-2">
          <div className={cn(gridClass, "gap-1")}>
            {visible.map((item, i) => {
              const isPrimary = i === 0;
              const isLastVisible = i === 3 && total > 4;
              const showOverlay = isLastVisible && extra > 0;
              const spanClass = count === 3 && isPrimary ? "row-span-2" : "";

              return (
                <button
                  key={item.id ?? `${item.url}-${i}`}
                  type="button"
                  onClick={() => {
                    if (item.type === "document") {
                      window.open(item.url, "_blank", "noopener,noreferrer");
                    } else {
                      setOpenIndex(i);
                    }
                  }}
                  className={cn(
                    "relative block min-h-0 min-w-0 w-full overflow-hidden bg-surface-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                    count === 3 ? "h-full" : "aspect-square",
                    spanClass
                  )}
                  aria-label={
                    item.type === "video"
                      ? `Video openen: ${item.filename || ""}`
                      : item.type === "document"
                      ? `Document openen: ${item.filename || ""}`
                      : `Foto openen: ${item.filename || ""}`
                  }
                >
                  <PreviewTile item={item} />

                  {showOverlay && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 text-2xl font-bold text-white">
                      +{extra}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <MediaLightbox
            key="lightbox"
            attachments={sorted}
            index={openIndex}
            onClose={() => setOpenIndex(null)}
            onChange={setOpenIndex}
            onDoubleLike={onDoubleLike}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function PreviewTile({ item }: { item: PostAttachment }) {
  if (item.type === "document") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-muted">
        <FileText size={32} strokeWidth={1.5} />
        <span className="max-w-full truncate text-xs font-medium">
          {item.filename || "Document"}
        </span>
      </div>
    );
  }

  if (item.type === "video") {
    return <VideoPreviewTile item={item} />;
  }

  return (
    <img
      src={resolveAttachmentUrl(item.url)}
      alt={item.filename || ""}
      loading="lazy"
      className="h-full w-full object-cover"
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        if (isLegacyUpload(item.url)) {
          img.style.display = "none";
          const parent = img.parentElement;
          if (parent && !parent.querySelector("[data-media-fallback]")) {
            const fallback = document.createElement("div");
            fallback.setAttribute("data-media-fallback", "");
            fallback.className = "flex h-full w-full flex-col items-center justify-center gap-1 bg-surface-3 text-muted";
            fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h.01M15 9h.01M9 15c1-1 2-1.5 3-1.5s2 .5 3 1.5"/></svg><span class="text-[10px] font-medium">Media niet beschikbaar</span>';
            parent.appendChild(fallback);
          }
        } else {
          img.style.opacity = "0.3";
        }
      }}
    />
  );
}

function VideoPreviewTile({ item }: { item: PostAttachment }) {
  const { posterUrl, status } = useVideoPoster(item.url);

  return (
    <>
      {status === "loading" && (
        <div className="flex h-full w-full items-center justify-center bg-surface-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted/30 border-t-muted" />
        </div>
      )}
      {status === "error" && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-surface-3 p-2 text-muted">
          <VideoIcon size={24} strokeWidth={1.5} />
          <span className="max-w-full truncate text-[10px] font-medium">
            {item.filename || "Video niet beschikbaar"}
          </span>
        </div>
      )}
      {status === "ready" && posterUrl && (
        <img
          src={posterUrl}
          alt={item.filename || ""}
          className="h-full w-full object-cover"
          onError={() => {}}
        />
      )}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-black/40 text-white shadow-lg backdrop-blur-sm">
          <Play size={22} className="ml-0.5" fill="currentColor" />
        </span>
      </div>
      {item.duration ? (
        <span className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">
          <VideoIcon size={12} />
          {formatDuration(item.duration)}
        </span>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* useVideoPoster — client-side canvas-based poster frame extraction   */
/* ------------------------------------------------------------------ */

function useVideoPoster(url: string): {
  posterUrl: string | null;
  status: "loading" | "ready" | "error";
} {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = resolveAttachmentUrl(url);

    const onLoadedMetadata = () => {
      const seekTime = Math.min(0.1, (video.duration || 1) / 2);
      try {
        video.currentTime = seekTime;
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    const onSeeked = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setStatus("error");
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        if (!cancelled) {
          setPosterUrl(dataUrl);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    const onError = () => {
      if (!cancelled) setStatus("error");
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      video.src = "";
    };
  }, [url]);

  return { posterUrl, status };
}

/* ------------------------------------------------------------------ */
/* Lightbox — uses the original GalleryItem for full-quality playback  */
/* ------------------------------------------------------------------ */

function MediaLightbox({
  attachments,
  index,
  onClose,
  onChange,
  onDoubleLike,
}: {
  attachments: PostAttachment[];
  index: number;
  onClose: () => void;
  onChange: (i: number) => void;
  onDoubleLike?: (x: number, y: number) => void;
}) {
  const touchStart = useRef<number | null>(null);
  const [direction, setDirection] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const goPrev = useCallback(() => {
    setDirection(-1);
    onChange(Math.max(0, index - 1));
  }, [index, onChange]);

  const goNext = useCallback(() => {
    setDirection(1);
    onChange(Math.min(attachments.length - 1, index + 1));
  }, [attachments.length, index, onChange]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    queueMicrotask(showControls);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [showControls]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      showControls();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, onClose, showControls]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
    showControls();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStart.current = null;
  };

  const current = attachments[index];
  if (!current) return null;
  const totalMedia = attachments.length;

  const overlayVariants = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
      };

  const slideVariants = {
    initial: (dir: number) => ({ opacity: 0, x: reducedMotion ? 0 : dir > 0 ? 60 : -60 }),
    animate: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: reducedMotion ? 0 : dir > 0 ? -60 : 60 }),
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
      initial={overlayVariants.initial}
      animate={overlayVariants.animate}
      exit={overlayVariants.exit}
      transition={overlayVariants.transition}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseMove={showControls}
    >
      <motion.div
        className={cn(
          "absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 py-3 transition-opacity duration-300",
          controlsVisible ? "opacity-100" : "opacity-0"
        )}
      >
        <span className="text-sm font-medium text-white/80">
          {index + 1} van {totalMedia}
        </span>
        <button
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Sluiten"
        >
          <X size={22} />
        </button>
      </motion.div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden p-4"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => {
          const t = e.target as HTMLElement;
          if (t.closest("video, button, a, [data-no-like]")) return;
          const rect = e.currentTarget.getBoundingClientRect();
          onDoubleLike?.(e.clientX - rect.left, e.clientY - rect.top);
        }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current.id ?? current.url + index}
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex items-center justify-center"
          >
            <LightboxMedia item={current} videoRef={videoRef} />
          </motion.div>
        </AnimatePresence>
      </div>

      {totalMedia > 1 && (
        <>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            disabled={index === 0}
            aria-label="Vorige"
            className={cn(
              "absolute left-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 disabled:opacity-30 sm:left-4 sm:h-12 sm:w-12",
              !controlsVisible && "opacity-0"
            )}
            animate={{ opacity: controlsVisible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft size={24} />
          </motion.button>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            disabled={index === totalMedia - 1}
            aria-label="Volgende"
            className={cn(
              "absolute right-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 disabled:opacity-30 sm:right-4 sm:h-12 sm:w-12",
              !controlsVisible && "opacity-0"
            )}
            animate={{ opacity: controlsVisible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronRight size={24} />
          </motion.button>
        </>
      )}

      {totalMedia > 1 && (
        <motion.div
          className={cn(
            "absolute bottom-0 left-0 right-0 z-20 flex justify-center gap-1.5 overflow-x-auto bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-8 transition-opacity duration-300",
            controlsVisible ? "opacity-100" : "opacity-0"
          )}
        >
          {attachments.map((item, i) => (
            <button
              key={item.id ?? `${item.url}-${i}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDirection(i > index ? 1 : -1);
                onChange(i);
              }}
              className={cn(
                "relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-colors sm:h-14 sm:w-14",
                i === index
                  ? "border-white"
                  : "border-transparent hover:border-white/60"
              )}
              aria-label={`Ga naar ${i + 1} van ${totalMedia}`}
            >
              <PreviewTile item={item} />
            </button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function LightboxMedia({
  item,
  videoRef,
}: {
  item: PostAttachment;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}) {
  if (item.type === "document") {
    return (
      <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl bg-surface p-8 text-foreground shadow-2xl">
        <FileText size={64} strokeWidth={1.2} className="text-muted" />
        <p className="text-lg font-semibold">{item.filename || "Document"}</p>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Download / openen
        </a>
      </div>
    );
  }

  if (item.type === "video") {
    return (
      <video
        ref={videoRef}
        key={item.url}
        src={resolveAttachmentUrl(item.url)}
        controls
        preload="metadata"
        playsInline
        className="block h-auto w-auto max-h-[82vh] max-w-[90vw] object-contain"
      />
    );
  }

  return (
    <img
      src={resolveAttachmentUrl(item.url)}
      alt={item.filename || ""}
      className="block h-auto w-auto max-h-[82vh] max-w-[90vw] object-contain"
    />
  );
}

function GalleryItem({ attachment }: { attachment: PostAttachment }) {
  if (attachment.type === "document") {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-surface-2"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">
          <FileText size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Document</p>
          <p className="truncate text-xs text-muted">{attachment.filename || attachment.url.split("/").pop()}</p>
        </div>
      </a>
    );
  }

  if (attachment.type === "video") {
    return (
      <video
        src={resolveAttachmentUrl(attachment.url)}
        controls
        preload="metadata"
        playsInline
        className="h-auto max-h-[80vh] w-auto max-w-full"
      />
    );
  }

  return (
    <img
      src={resolveAttachmentUrl(attachment.url)}
      alt=""
      loading="lazy"
      className="h-auto max-h-[80vh] w-auto max-w-full"
    />
  );
}
