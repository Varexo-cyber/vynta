"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Monitor,
  MonitorOff,
  PhoneOff,
  Phone,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Expand,
  Shrink,
  Columns2,
  SquareStack,
  LayoutGrid,
  X,
  Users,
  MessageSquare,
  MoreVertical,
  Settings,
  Info,
} from "lucide-react";
import { CompanyAvatar } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/hooks/use-call";
import type { Company } from "@/lib/types";

type CallState = "idle" | "outgoing" | "incoming" | "connected" | "ending";
type CallKind = "audio" | "video";
type LayoutMode = "focus" | "side-by-side" | "compact" | "screen-only";
type PiPCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface CallPanelProps {
  call: {
    callState: CallState;
    callKind: CallKind | null;
    callId: string | null;
    duration: number;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    screenStream: MediaStream | null;
    isScreenSharing: boolean;
    error: string | null;
    micEnabled: boolean;
    camEnabled: boolean;
    speakerEnabled: boolean;
    localSpeaking: boolean;
    remoteSpeaking: boolean;
    statusText: string;
    startCall: (kind: CallKind) => void;
    acceptCall: () => void;
    declineCall: () => void;
    endCall: () => void;
    toggleMic: () => void;
    toggleCam: () => void;
    enableCamera: () => void;
    disableCamera: () => void;
    toggleSpeaker: () => void;
    toggleScreenShare: () => void;
  };
  company: Company;
  me: Company;
  onMinimize: () => void;
  onToggleFullscreen: () => void;
  isFullscreen?: boolean;
  className?: string;
}

const MIN_HEIGHT = 220;
const MAX_HEIGHT_PCT = 0.85;
const DEFAULT_HEIGHT_PCT = 0.5;
const STORAGE_KEY = "vynta-call-height";

function VideoPlayer({
  stream,
  muted,
  className,
  mirror,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
  mirror?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !stream) return;
    el.srcObject = stream;
    el.play().catch(() => {});
  }, [stream]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className={cn("h-full w-full object-contain", mirror && "scale-x-[-1]", className)}
    />
  );
}

function RemoteAudio({ stream, muted }: { stream: MediaStream | null; muted: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (stream) {
      el.srcObject = stream;
      el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [stream]);
  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);
  return <audio ref={ref} autoPlay className="hidden" />;
}

function CallButton({
  onClick,
  active,
  danger,
  highlight,
  label,
  icon,
  size = 20,
}: {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  highlight?: boolean;
  label: string;
  icon: React.ReactNode;
  size?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "grid h-11 w-11 place-items-center rounded-full border backdrop-blur-sm transition-all active:scale-95",
        danger
          ? "border-red-500/40 bg-red-500/80 text-white hover:bg-red-500"
          : highlight
            ? "border-green-500/40 bg-green-500/80 text-white hover:bg-green-500"
            : active
              ? "border-white/15 bg-white/10 text-white hover:bg-white/20"
              : "border-white/10 bg-white/5 text-white/60 hover:bg-white/15"
      )}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

function SpeakingRing({
  speaking,
  children,
  className,
}: {
  speaking: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl transition-all duration-200",
        speaking && "ring-[3px] ring-green-500/70 ring-offset-2 ring-offset-[#0a0a0a]",
        className
      )}
    >
      {children}
    </div>
  );
}

function ParticipantTile({
  stream,
  name,
  isLocal,
  speaking,
  micEnabled,
  camEnabled,
  avatar,
  showVideo,
  mirror,
  className,
}: {
  stream: MediaStream | null;
  name: string;
  isLocal: boolean;
  speaking: boolean;
  micEnabled: boolean;
  camEnabled: boolean;
  avatar: React.ReactNode;
  showVideo: boolean;
  mirror?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#111] transition-all duration-200",
        speaking && "ring-[3px] ring-green-500/60 ring-offset-2 ring-offset-[#0a0a0a]",
        className
      )}
    >
      {showVideo && stream ? (
        <VideoPlayer stream={stream} muted={isLocal} mirror={mirror} className="h-full w-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-3 py-6">
          <SpeakingRing speaking={speaking}>{avatar}</SpeakingRing>
          <div className="text-center">
            <p className="text-sm font-semibold text-white/90">{name}</p>
            <p className="text-xs text-white/40">{isLocal ? "Jij" : ""}</p>
          </div>
        </div>
      )}
      {/* Status badges */}
      <div className="absolute left-2 top-2 flex items-center gap-1.5">
        <span className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white/70 backdrop-blur-sm">
          {isLocal ? "Jij" : name}
        </span>
      </div>
      <div className="absolute bottom-2 left-2 flex items-center gap-1">
        {!micEnabled && (
          <span className="grid h-5 w-5 place-items-center rounded bg-black/50 text-red-400 backdrop-blur-sm">
            <MicOff size={12} />
          </span>
        )}
        {!camEnabled && !!callKindHelper(stream) && (
          <span className="grid h-5 w-5 place-items-center rounded bg-black/50 text-white/50 backdrop-blur-sm">
            <VideoOff size={12} />
          </span>
        )}
        {speaking && (
          <span className="h-2 w-2 rounded-full bg-green-400" />
        )}
      </div>
    </div>
  );
}

function callKindHelper(stream: MediaStream | null): boolean {
  return !!stream && stream.getVideoTracks().length > 0;
}

export function CallPanel({
  call,
  company,
  me,
  onMinimize,
  onToggleFullscreen,
  isFullscreen = false,
  className,
}: CallPanelProps) {
  const isIncoming = call.callState === "incoming";
  const isOutgoing = call.callState === "outgoing";
  const isConnected = call.callState === "connected";
  const isVideo = call.callKind === "video";

  const hasRemoteVideo = !!(
    isConnected && call.remoteStream && call.remoteStream.getVideoTracks().length > 0 && call.remoteStream.getVideoTracks().some((t) => t.enabled)
  );
  const hasLocalVideo = !!(
    call.localStream && call.localStream.getVideoTracks().length > 0 && call.localStream.getVideoTracks().some((t) => t.enabled)
  );
  const showRemoteVideo = !!(isConnected && hasRemoteVideo && !call.isScreenSharing);
  const showScreenShare = !!(isConnected && call.isScreenSharing);
  const showLocalVideo = !!hasLocalVideo;

  const [layoutMode, setLayoutMode] = useState<LayoutMode>("focus");
  const [pipCorner, setPipCorner] = useState<PiPCorner>("bottom-right");
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  // Drag state for PiP
  const pipRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origLeft: number; origTop: number } | null>(null);

  const statusLabel = useMemo(() => {
    if (call.statusText) return call.statusText;
    if (isIncoming) return isVideo ? "Inkomende video-oproep" : "Inkomende audio-oproep";
    if (isOutgoing) return isVideo ? "Video-oproep bellen…" : "Audio-oproep bellen…";
    if (isConnected) return isVideo ? "Videogesprek" : "Audiogesprek";
    return "";
  }, [call.statusText, isIncoming, isOutgoing, isConnected, isVideo]);

  // Auto-switch to screen-only when screen sharing
  useEffect(() => {
    if (call.isScreenSharing) {
      setLayoutMode((prev) => (prev === "screen-only" ? prev : "screen-only"));
    }
  }, [call.isScreenSharing]);

  const pipPositionClass = useMemo(() => {
    switch (pipCorner) {
      case "top-left": return "top-3 left-3";
      case "top-right": return "top-3 right-3";
      case "bottom-left": return "bottom-3 left-3";
      case "bottom-right": return "bottom-3 right-3";
    }
  }, [pipCorner]);

  const handlePiPDragStart = useCallback((e: React.MouseEvent) => {
    if (!pipRef.current) return;
    const rect = pipRef.current.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origLeft: rect.left,
      origTop: rect.top,
    };
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (!dragRef.current) return;
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current || !pipRef.current?.parentElement) return;
      const parent = pipRef.current.parentElement.getBoundingClientRect();
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const newLeft = dragRef.current.origLeft + dx - parent.left;
      const newTop = dragRef.current.origTop + dy - parent.top;
      const centerX = newLeft + pipRef.current.offsetWidth / 2;
      const centerY = newTop + pipRef.current.offsetHeight / 2;
      const parentCenterX = parent.width / 2;
      const parentCenterY = parent.height / 2;
      if (centerY < parentCenterY) {
        setPipCorner(centerX < parentCenterX ? "top-left" : "top-right");
      } else {
        setPipCorner(centerX < parentCenterX ? "bottom-left" : "bottom-right");
      }
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const layoutIcons: Record<LayoutMode, React.ReactNode> = {
    "focus": <SquareStack size={18} />,
    "side-by-side": <Columns2 size={18} />,
    "compact": <Minimize2 size={18} />,
    "screen-only": <Monitor size={18} />,
  };

  const layoutLabels: Record<LayoutMode, string> = {
    "focus": "Focusweergave",
    "side-by-side": "Naast elkaar",
    "compact": "Compact",
    "screen-only": "Alleen scherm",
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl bg-[#0a0a0a] text-white",
        className
      )}
    >
      <RemoteAudio stream={call.remoteStream} muted={!call.speakerEnabled} />

      {/* Top bar */}
      <div className="relative flex shrink-0 items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <img
            src="/logoaa.png"
            alt="Vynta Call"
            className={cn(
              "w-auto shrink-0",
              call.callState === "outgoing" && "vynta-call-pulse"
            )}
            style={{ height: 44 }}
          />
          <div className="flex flex-col">
            <span className="text-[19px] font-bold leading-[1.1] text-white">Vynta Call</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[12px] font-medium text-white/60">
              {isConnected && (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Verbonden
                </>
              )}
              {!isConnected && call.callState === "outgoing" && (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  Bellen…
                </>
              )}
              {call.isScreenSharing && (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  Scherm delen
                </>
              )}
            </span>
          </div>
          {isConnected && (
            <div className="ml-2 flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-white/60">{formatDuration(call.duration)}</span>
            </div>
          )}
        </div>
        {call.callState === "outgoing" && (
          <div className="pointer-events-none absolute left-6 top-[calc(100%-1px)] h-[2px] w-12 origin-left rounded-full bg-brand vynta-call-underline" />
        )}
        {isConnected && (
          <div className="pointer-events-none absolute left-6 top-[calc(100%-1px)] h-[2px] w-10 rounded-full bg-brand/40" />
        )}
        <div className="flex items-center gap-1">
          {/* Layout switcher */}
          {isConnected && (
            <div className="relative">
              <button
                onClick={() => setShowLayoutMenu((v) => !v)}
                className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
                aria-label="Weergave wijzigen"
                title="Weergave wijzigen"
              >
                {layoutIcons[layoutMode]}
              </button>
              {showLayoutMenu && (
                <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] py-1 shadow-xl">
                  {(Object.keys(layoutLabels) as LayoutMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => { setLayoutMode(mode); setShowLayoutMenu(false); }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-white/10",
                        layoutMode === mode ? "text-white" : "text-white/50"
                      )}
                    >
                      {layoutIcons[mode]}
                      {layoutLabels[mode]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Participants */}
          {isConnected && (
            <button
              onClick={() => setShowParticipants((v) => !v)}
              className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
              aria-label="Deelnemers bekijken"
              title="Deelnemers bekijken"
            >
              <Users size={18} />
            </button>
          )}
          {/* Fullscreen toggle */}
          <button
            onClick={onToggleFullscreen}
            className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
            aria-label={isFullscreen ? "Volledig scherm verlaten" : "Volledig scherm"}
            title={isFullscreen ? "Volledig scherm verlaten" : "Volledig scherm"}
          >
            {isFullscreen ? <Shrink size={18} /> : <Expand size={18} />}
          </button>
          {/* Minimize */}
          <button
            onClick={onMinimize}
            className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
            aria-label="Call verkleinen"
            title="Call verkleinen"
          >
            <ChevronDown size={18} />
          </button>
        </div>
      </div>

      {/* Participants panel */}
      {showParticipants && isConnected && (
        <div className="absolute right-4 top-14 z-40 w-56 rounded-xl border border-white/10 bg-[#1a1a1a] p-3 shadow-xl">
          <p className="mb-2 text-xs font-semibold text-white/40">Deelnemers</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CompanyAvatar name={me.name} color={me.logoColor} logoUrl={me.logoUrl} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{me.name}</p>
                <p className="text-xs text-white/40">Jij</p>
              </div>
              {!call.micEnabled && <MicOff size={14} className="text-red-400" />}
              {!call.camEnabled && <VideoOff size={14} className="text-white/30" />}
            </div>
            <div className="flex items-center gap-2">
              <CompanyAvatar name={company.name} color={company.logoColor} logoUrl={company.logoUrl} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{company.name}</p>
                <p className="text-xs text-white/40">{statusLabel}</p>
              </div>
              {call.remoteSpeaking && <span className="h-2 w-2 rounded-full bg-green-400" />}
            </div>
          </div>
        </div>
      )}

      {/* Call stage */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-3 py-2">
        {/* Screen share full view */}
        {showScreenShare && (
          <div className="absolute inset-0 z-0 flex items-center justify-center">
            <VideoPlayer stream={call.screenStream} className="max-h-full max-w-full bg-black" />
            <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
              <Monitor size={16} />
              Je deelt je scherm
            </div>
          </div>
        )}

        {/* Side-by-side layout */}
        {isConnected && layoutMode === "side-by-side" && !showScreenShare && (
          <div className="flex h-full w-full items-center justify-center gap-2">
            <ParticipantTile
              stream={call.remoteStream}
              name={company.name}
              isLocal={false}
              speaking={call.remoteSpeaking}
              micEnabled={true}
              camEnabled={hasRemoteVideo}
              avatar={<CompanyAvatar name={company.name} color={company.logoColor} logoUrl={company.logoUrl} size={80} />}
              showVideo={showRemoteVideo}
              className="h-full flex-1"
            />
            <ParticipantTile
              stream={call.localStream}
              name={me.name}
              isLocal={true}
              speaking={call.localSpeaking}
              micEnabled={call.micEnabled}
              camEnabled={showLocalVideo}
              avatar={<CompanyAvatar name={me.name} color={me.logoColor} logoUrl={me.logoUrl} size={80} />}
              showVideo={showLocalVideo}
              mirror
              className="h-full flex-1"
            />
          </div>
        )}

        {/* Focus layout: remote main, local PiP */}
        {(isConnected ? layoutMode === "focus" || layoutMode === "screen-only" : isOutgoing || isIncoming) && !showScreenShare && (
          <>
            {showRemoteVideo ? (
              <div className="absolute inset-0 z-0 flex items-center justify-center">
                <VideoPlayer stream={call.remoteStream} className="max-h-full max-w-full bg-black" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div
                  className={cn(
                    "rounded-full transition-all duration-200",
                    call.remoteSpeaking && "ring-[3px] ring-green-500/70 ring-offset-4 ring-offset-[#0a0a0a]"
                  )}
                >
                  <CompanyAvatar name={company.name} color={company.logoColor} logoUrl={company.logoUrl} size={96} />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold">{company.name}</h3>
                  <p className="mt-0.5 text-sm text-white/50">{statusLabel}</p>
                </div>
              </div>
            )}

            {/* Local PiP */}
            {showLocalVideo && (
              <div
                ref={pipRef}
                onMouseDown={handlePiPDragStart}
                onDoubleClick={() => setPipCorner((c) => c === "bottom-right" ? "top-left" : "bottom-right")}
                className={cn(
                  "absolute z-20 aspect-video w-32 overflow-hidden rounded-xl border-2 border-white/10 bg-black shadow-2xl transition-all duration-150 sm:w-40",
                  pipPositionClass,
                  "cursor-move"
                )}
              >
                <VideoPlayer stream={call.localStream} muted mirror />
                <div className="absolute left-1.5 top-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white/70 backdrop-blur-sm">
                  Jij
                </div>
                {!call.micEnabled && (
                  <div className="absolute bottom-1.5 left-1.5 grid h-5 w-5 place-items-center rounded bg-black/50 text-red-400">
                    <MicOff size={12} />
                  </div>
                )}
              </div>
            )}

            {/* Local avatar when no video */}
            {!showLocalVideo && (isConnected || isOutgoing) && (
              <div className={cn("absolute z-20", pipPositionClass)}>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-xl border-2 border-white/10 bg-black/60 p-2 backdrop-blur-sm transition-all duration-200",
                    call.localSpeaking && "ring-2 ring-green-500/60"
                  )}
                >
                  <CompanyAvatar name={me.name} color={me.logoColor} logoUrl={me.logoUrl} size={36} />
                  <div className="pr-1">
                    <p className="text-xs font-medium text-white/80">Jij</p>
                    {!call.micEnabled && <MicOff size={12} className="text-red-400" />}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Screen share with PiP tiles */}
        {showScreenShare && (
          <>
            {/* Remote PiP */}
            {showRemoteVideo && (
              <div className={cn("absolute z-20 aspect-video w-32 overflow-hidden rounded-xl border-2 border-white/10 bg-black shadow-2xl sm:w-40", pipPositionClass)}>
                <VideoPlayer stream={call.remoteStream} className="max-h-full max-w-full" />
                <div className="absolute left-1.5 top-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white/70 backdrop-blur-sm">
                  {company.name}
                </div>
              </div>
            )}
            {/* Local PiP */}
            {showLocalVideo && (
              <div
                ref={pipRef}
                onMouseDown={handlePiPDragStart}
                className={cn(
                  "absolute z-20 aspect-video w-32 overflow-hidden rounded-xl border-2 border-white/10 bg-black shadow-2xl transition-all duration-150 cursor-move sm:w-40",
                  pipCorner === "bottom-right" ? "bottom-3 left-3" : pipCorner === "bottom-left" ? "bottom-3 right-3" : pipCorner === "top-right" ? "top-3 left-3" : "top-3 right-3"
                )}
              >
                <VideoPlayer stream={call.localStream} muted mirror />
                <div className="absolute left-1.5 top-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white/70 backdrop-blur-sm">
                  Jij
                </div>
              </div>
            )}
          </>
        )}

        {/* Remote name overlay when video is showing */}
        {(showRemoteVideo || showScreenShare) && layoutMode !== "side-by-side" && (
          <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
            <div className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-md",
              call.remoteSpeaking ? "bg-green-500/20 ring-1 ring-green-500/50" : "bg-black/40"
            )}>
              <span className={cn(
                "h-2 w-2 rounded-full",
                call.remoteSpeaking ? "bg-green-400" : "bg-white/30"
              )} />
              <span className="text-sm font-medium">{company.name}</span>
              <span className="text-xs text-white/40">·</span>
              <span className="text-xs text-white/50">{statusLabel}</span>
            </div>
          </div>
        )}

        {/* Error display */}
        {call.error && (
          <div className="absolute top-3 left-1/2 z-30 -translate-x-1/2 rounded-xl bg-red-500/20 px-4 py-2 text-sm text-red-100 backdrop-blur-md">
            {call.error}
          </div>
        )}
      </div>

      {/* Call controls */}
      <div className="relative z-10 flex shrink-0 items-center justify-center gap-2 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:gap-2.5">
        {isIncoming && (
          <>
            <button
              onClick={call.declineCall}
              className="grid h-13 w-13 place-items-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{ width: 52, height: 52 }}
              aria-label="Weigeren"
              title="Weigeren"
            >
              <PhoneOff size={24} />
            </button>
            <button
              onClick={call.acceptCall}
              className="grid place-items-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{ width: 52, height: 52 }}
              aria-label="Accepteren"
              title="Accepteren"
            >
              <Phone size={24} />
            </button>
          </>
        )}

        {(isOutgoing || isConnected) && (
          <>
            <CallButton
              onClick={call.toggleMic}
              active={call.micEnabled}
              danger={!call.micEnabled}
              label={call.micEnabled ? "Microfoon dempen" : "Microfoon inschakelen"}
              icon={call.micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
            />
            <CallButton
              onClick={() => (call.camEnabled ? call.disableCamera() : call.enableCamera())}
              active={call.camEnabled}
              label={call.camEnabled ? "Camera uitschakelen" : "Camera inschakelen"}
              icon={call.camEnabled ? <Video size={18} /> : <VideoOff size={18} />}
            />
            <CallButton
              onClick={call.toggleSpeaker}
              active={call.speakerEnabled}
              danger={!call.speakerEnabled}
              label={call.speakerEnabled ? "Geluid dempen" : "Geluid inschakelen"}
              icon={call.speakerEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            />
            {isConnected && (
              <CallButton
                onClick={call.toggleScreenShare}
                active={!call.isScreenSharing}
                highlight={call.isScreenSharing}
                label={call.isScreenSharing ? "Delen stoppen" : "Scherm delen"}
                icon={call.isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
              />
            )}
            {/* More options */}
            <div className="relative">
              <CallButton
                onClick={() => setShowMoreMenu((v) => !v)}
                active={showMoreMenu}
                label="Meer opties"
                icon={<MoreVertical size={18} />}
              />
              {showMoreMenu && (
                <div className="absolute bottom-14 left-1/2 z-30 w-48 -translate-x-1/2 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] py-1 shadow-xl">
                  <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white">
                    <Settings size={16} /> Instellingen
                  </button>
                  <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white">
                    <Info size={16} /> Gespreksinformatie
                  </button>
                </div>
              )}
            </div>
            {/* Hang up */}
            <button
              onClick={call.endCall}
              className="ml-1 grid h-11 w-11 place-items-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              aria-label="Oproep beëindigen"
              title="Oproep beëindigen"
            >
              <PhoneOff size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* Compact call bar for minimized mode */
export function CompactCallBar({
  call,
  company,
  onExpand,
  onEndCall,
}: {
  call: CallPanelProps["call"];
  company: Company;
  onExpand: () => void;
  onEndCall: () => void;
}) {
  const isVideo = call.callKind === "video";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2 shadow-sm">
      <div className="flex min-w-0 items-center gap-2">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-full w-full rounded-full bg-red-500" />
        </span>
        <CompanyAvatar name={company.name} color={company.logoColor} logoUrl={company.logoUrl} size={28} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{company.name}</p>
          <p className="text-xs text-muted">
            {isVideo ? "Video" : "Audio"} · {formatDuration(call.duration)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={call.toggleMic}
          className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2"
          aria-label={call.micEnabled ? "Microfoon dempen" : "Microfoon aan"}
          title={call.micEnabled ? "Microfoon dempen" : "Microfoon aan"}
        >
          {call.micEnabled ? <Mic size={16} /> : <MicOff size={16} />}
        </button>
        {isVideo && (
          <button
            onClick={() => (call.camEnabled ? call.disableCamera() : call.enableCamera())}
            className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2"
            aria-label={call.camEnabled ? "Camera uit" : "Camera aan"}
            title={call.camEnabled ? "Camera uit" : "Camera aan"}
          >
            {call.camEnabled ? <Video size={16} /> : <VideoOff size={16} />}
          </button>
        )}
        <button
          onClick={onExpand}
          className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-surface-3"
        >
          Call openen
        </button>
        <button
          onClick={onEndCall}
          className="grid h-8 w-8 place-items-center rounded-full bg-red-500 text-white transition-transform hover:scale-105 active:scale-95"
          aria-label="Oproep beëindigen"
          title="Oproep beëindigen"
        >
          <PhoneOff size={16} />
        </button>
      </div>
    </div>
  );
}

/* Incoming call overlay (non-fullscreen, within conversation area) */
export function IncomingCallOverlay({
  call,
  company,
  me,
}: {
  call: CallPanelProps["call"];
  company: Company;
  me: Company;
}) {
  const isVideo = call.callKind === "video";
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#0a0a0a] px-8 py-8 text-white shadow-2xl">
        <p className="text-xs font-medium text-white/40">Inkomende {isVideo ? "video" : "audio"}-oproep</p>
        <div className="rounded-full ring-2 ring-white/10">
          <CompanyAvatar name={company.name} color={company.logoColor} logoUrl={company.logoUrl} size={80} />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-semibold">{company.name}</h3>
          <p className="mt-1 text-sm text-white/50">{isVideo ? "Video-oproep" : "Audio-oproep"}</p>
        </div>
        <div className="mt-2 flex items-center gap-4">
          <button
            onClick={call.declineCall}
            className="grid h-14 w-14 place-items-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            aria-label="Weigeren"
            title="Weigeren"
          >
            <PhoneOff size={26} />
          </button>
          <button
            onClick={call.acceptCall}
            className="grid h-14 w-14 place-items-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            aria-label="Accepteren"
            title="Accepteren"
          >
            <Phone size={26} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* Resize handle component */
export function ResizeHandle({
  onResize,
  onDoubleClick,
}: {
  onResize: (deltaY: number) => void;
  onDoubleClick: () => void;
}) {
  const dragging = useRef(false);
  const startY = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientY - startY.current;
      onResize(delta);
      startY.current = e.clientY;
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [onResize]);

  // Touch support
  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      const delta = touch.clientY - startY.current;
      onResize(delta);
      startY.current = touch.clientY;
    };
    const onTouchEnd = () => {
      dragging.current = false;
      document.body.style.userSelect = "";
    };
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onResize]);

  return (
    <div
      onMouseDown={(e) => {
        dragging.current = true;
        startY.current = e.clientY;
        document.body.style.cursor = "row-resize";
        document.body.style.userSelect = "none";
      }}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        if (!touch) return;
        dragging.current = true;
        startY.current = touch.clientY;
        document.body.style.userSelect = "none";
      }}
      onDoubleClick={onDoubleClick}
      className="group flex h-2 shrink-0 cursor-row-resize items-center justify-center bg-border transition-colors hover:bg-brand/50"
      aria-label="Hoogte aanpassen"
      role="separator"
    >
      <div className="h-1 w-10 rounded-full bg-muted/40 transition-colors group-hover:bg-brand" />
    </div>
  );
}

export { MIN_HEIGHT, MAX_HEIGHT_PCT, DEFAULT_HEIGHT_PCT, STORAGE_KEY };
