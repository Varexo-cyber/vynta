"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn, ZoomOut, Check, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type CropData = { x: number; y: number; zoom: number };

export function CropModal({
  open,
  imageUrl,
  aspectRatio,
  title,
  onCancel,
  onSave,
  saving = false,
}: {
  open: boolean;
  imageUrl: string | null;
  aspectRatio: number;
  title: string;
  onCancel: () => void;
  onSave: (cropData: CropData) => void;
  saving?: boolean;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      });
    }
  }, [open, imageUrl]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
  }, [offset]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset({
      x: offsetStart.current.x + dx,
      y: offsetStart.current.y + dy,
    });
  }, [dragging]);

  const onPointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  const containerStyle: React.CSSProperties = {
    aspectRatio: String(aspectRatio),
  };

  return (
    <AnimatePresence>
      {open && imageUrl && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
          <motion.div
            initial={{ y: "100%", opacity: 0.5, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
              <button
                onClick={onCancel}
                className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2"
                aria-label="Sluiten"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 px-6 py-2">
              <div
                ref={containerRef}
                className="relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl bg-black/80"
                style={containerStyle}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
                role="button"
                tabIndex={0}
                aria-label="Afbeelding verplaatsen"
              >
                <img
                  src={imageUrl}
                  alt="Voorbeeld"
                  className="absolute select-none"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: "auto",
                    height: "100%",
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
                    transformOrigin: "center",
                    cursor: dragging ? "grabbing" : "grab",
                    touchAction: "none",
                  }}
                  draggable={false}
                />
              </div>

              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
                  className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                  aria-label="Uitzoomen"
                >
                  <ZoomOut size={18} />
                </button>
                <span className="min-w-[3rem] text-center text-sm font-medium tabular">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                  className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                  aria-label="Inzoomen"
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
                  className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                  aria-label="Resetten"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button
                onClick={onCancel}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                Annuleren
              </button>
              <button
                onClick={() => onSave({ x: offset.x, y: offset.y, zoom })}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {saving ? "Opslaan…" : "Opslaan"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
