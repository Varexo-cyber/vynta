"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";

export function VideoPlayer({
  src,
  poster,
  className,
  videoClassName,
}: {
  src: string;
  poster?: string;
  className?: string;
  videoClassName?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => {
      setProgress(video.currentTime / (video.duration || 1));
      setDuration(video.duration || 0);
    };
    const onLoadedMetadata = () => setDuration(video.duration || 0);
    const onEnded = () => setPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.muted !== muted) video.muted = muted;
  }, [muted]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * duration;
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    if (playing) {
      controlsTimeout.current = setTimeout(() => setShowControls(false), 2500);
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      video.requestFullscreen().catch(() => {});
    }
  };

  const currentTime = videoRef.current?.currentTime ?? 0;

  return (
    <div
      className={cn("group relative w-full overflow-hidden rounded-2xl bg-foreground/5", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        className={cn("mx-auto block h-auto max-h-[80vh] w-auto max-w-full cursor-pointer", videoClassName)}
        onClick={togglePlay}
      />
      <button
        onClick={togglePlay}
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity duration-200",
          playing && !showControls ? "opacity-0" : "opacity-100"
        )}
      >
        <span className="grid h-16 w-16 place-items-center rounded-full bg-background/90 text-foreground shadow-lg backdrop-blur-sm transition-transform duration-200 group-hover:scale-105">
          {playing ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
        </span>
      </button>
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent px-4 pb-3 pt-8 transition-opacity duration-200",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="flex items-center gap-3 text-white">
          <button
            onClick={togglePlay}
            className="rounded-full p-1.5 transition-colors hover:bg-white/20"
          >
            {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
          <div className="flex-1">
            <div
              className="h-1.5 cursor-pointer rounded-full bg-white/30"
              onClick={handleSeek}
            >
              <div
                className="relative h-full rounded-full bg-brand"
                style={{ width: `${progress * 100}%` }}
              >
                <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 translate-x-1/2 rounded-full bg-brand shadow" />
              </div>
            </div>
          </div>
          <span className="text-xs font-medium tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <button
            onClick={() => setMuted((m) => !m)}
            className="rounded-full p-1.5 transition-colors hover:bg-white/20"
          >
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="rounded-full p-1.5 transition-colors hover:bg-white/20"
          >
            <Maximize size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
