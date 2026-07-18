"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  FileText,
  MapPin,
  Mic,
  Paperclip,
  Image as ImageIcon,
  FileUp,
  Briefcase,
  MoreVertical,
  Phone,
  Video,
  X,
  Check,
  CheckCheck,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Square,
  MoreHorizontal,
  Smile,
  Eye,
  Trash2,
  Info,
  CheckSquare,
  BellOff,
  Bell,
  LogOut,
  ShieldAlert,
  Ban,
  Flag,
  Globe,
  Mail,
  Building2,
  Copy,
  Pin,
  Forward,
} from "lucide-react";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { useApp } from "@/components/app-store";
import {
  sendMessage,
  markConversationRead,
  archiveChat,
  muteChat,
  unmuteChat,
  blockContact,
  unblockContact,
  reportContact,
} from "@/lib/actions";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CompanyAvatar, VerifiedBadge, TypeBadge } from "@/components/ui/primitives";
import { VoiceWaveform } from "@/components/voice-waveform";
import { useCall } from "@/hooks/use-call";
import { cn, formatFileSize } from "@/lib/utils";
import { sanitizeHtml, isFormattedBody, convertMarkdownToHtml, htmlToPlainText } from "@/lib/rich-text";
import { RichTextEditor, type RichTextEditorHandle } from "@/components/rich-text-editor";
import { CallPanel, CompactCallBar, IncomingCallOverlay, ResizeHandle, MIN_HEIGHT, MAX_HEIGHT_PCT, DEFAULT_HEIGHT_PCT, STORAGE_KEY } from "@/components/call-panel";
import type { Conversation, Message, MessageAttachment, PostType, Company } from "@/lib/types";

const PAGE_SIZE = 50;

type PendingAttachment = {
  id: string;
  file: File;
  localUrl: string;
  type: MessageAttachment["type"];
  mimeType: string;
  originalName: string;
  size: number;
  status: "uploading" | "done" | "error";
  progress: number;
  error?: string;
  attachment?: MessageAttachment;
};

export function ConversationClient({
  conversation,
  needBody,
  needType,
  initialMuted = false,
  initialMuteIndefinite = false,
  initialMutedUntil,
  initialBlocked = false,
}: {
  conversation: Conversation;
  needBody?: string;
  needType?: string;
  initialMuted?: boolean;
  initialMuteIndefinite?: boolean;
  initialMutedUntil?: string;
  initialBlocked?: boolean;
}) {
  const { companyById, me } = useApp();
  const company = companyById(conversation.companyId);

  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [showMore, setShowMore] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [lightboxAttachment, setLightboxAttachment] = useState<MessageAttachment | null>(null);
  const [recording, setRecording] = useState<{
    state: "idle" | "recording" | "paused" | "preview";
    time: number;
    chunks: Blob[];
    mediaRecorder: MediaRecorder | null;
    blob: Blob | null;
    url: string | null;
    samples: number[];
    error?: string;
  }>({ state: "idle", time: 0, chunks: [], mediaRecorder: null, blob: null, url: null, samples: [] });
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showHeaderMore, setShowHeaderMore] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);

  // Chat management state
  const router = useRouter();
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showMuteSubmenu, setShowMuteSubmenu] = useState(false);
  const [muted, setMuted] = useState(initialMuted);
  const [muteIndefinite, setMuteIndefinite] = useState(initialMuteIndefinite);
  const [mutedUntil, setMutedUntil] = useState<string | undefined>(initialMutedUntil);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showContactPanel, setShowContactPanel] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMsgs, setSelectedMsgs] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Call panel state
  const [callMinimized, setCallMinimized] = useState(false);
  const [callFullscreen, setCallFullscreen] = useState(false);
  const [callHeightPct, setCallHeightPct] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_HEIGHT_PCT;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const val = parseFloat(stored);
      if (!isNaN(val) && val >= 0.15 && val <= MAX_HEIGHT_PCT) return val;
    }
    return DEFAULT_HEIGHT_PCT;
  });
  const callContainerRef = useRef<HTMLDivElement>(null);

  const handleCallResize = useCallback((deltaY: number) => {
    const container = callContainerRef.current;
    if (!container) return;
    const totalHeight = container.clientHeight;
    if (totalHeight <= 0) return;
    const callAreaHeight = totalHeight * callHeightPct;
    const newCallHeight = callAreaHeight - deltaY;
    const newPct = Math.max(MIN_HEIGHT / totalHeight, Math.min(MAX_HEIGHT_PCT, newCallHeight / totalHeight));
    setCallHeightPct(newPct);
  }, [callHeightPct]);

  const handleCallResizeEnd = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, String(callHeightPct)); } catch {}
  }, [callHeightPct]);

  const resetCallHeight = useCallback(() => {
    setCallHeightPct(DEFAULT_HEIGHT_PCT);
    try { localStorage.setItem(STORAGE_KEY, String(DEFAULT_HEIGHT_PCT)); } catch {}
  }, []);

  // Persist height when resize ends (on mouseup)
  useEffect(() => {
    const onUp = () => handleCallResizeEnd();
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [handleCallResizeEnd]);

  const call = useCall({
    conversationId: conversation.id,
    myCompanyId: me.id,
    otherCompanyId: company?.id ?? "",
    enabled: !!company,
  });

  // Reset minimized state when call ends
  useEffect(() => {
    if (call.callState === "idle") {
      setCallMinimized(false);
      setCallFullscreen(false);
    }
  }, [call.callState]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sampleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const mergeMessages = useCallback((incoming: Message[]) => {
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of incoming) map.set(m.id, m);
      return Array.from(map.values()).sort((a, b) => a.time.localeCompare(b.time));
    });
  }, []);

  const fetchLatest = useCallback(async () => {
    const res = await fetch(`/api/messages/${conversation.id}`);
    if (!res.ok) return;
    const data = (await res.json()) as { messages: Message[]; hasMore: boolean };
    mergeMessages(data.messages);
    setHasMore(data.hasMore);
  }, [conversation.id, mergeMessages]);

  const loadOlder = useCallback(async () => {
    const firstId = messages[0]?.id;
    if (!firstId || loadingMore) return;
    setLoadingMore(true);
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    const res = await fetch(`/api/messages/${conversation.id}?before=${encodeURIComponent(firstId)}`);
    if (res.ok) {
      const data = (await res.json()) as { messages: Message[]; hasMore: boolean };
      mergeMessages(data.messages);
      setHasMore(data.hasMore);
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
    }
    setLoadingMore(false);
  }, [conversation.id, loadingMore, messages, mergeMessages]);

  useEffect(() => {
    markConversationRead(conversation.id);
    fetchLatest();
    const id = setInterval(fetchLatest, 4000);
    return () => clearInterval(id);
  }, [conversation.id, fetchLatest]);

  useEffect(() => {
    scrollToBottom(false);
  }, []);

  useEffect(() => {
    if (isNearBottom()) scrollToBottom();
    else setShowScrollButton(true);
  }, [messages.length, isNearBottom, scrollToBottom]);

  const handleScroll = useCallback(() => {
    setShowScrollButton(!isNearBottom());
  }, [isNearBottom]);

  const insertOptimistic = useCallback((temp: Message) => {
    setMessages((prev) => [...prev, temp]);
    scrollToBottom();
  }, [scrollToBottom]);

  const replaceOptimistic = useCallback((tempId: string, real: Message) => {
    setMessages((prev) => prev.map((m) => (m.id === tempId ? real : m)));
  }, []);

  const failOptimistic = useCallback((tempId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
    );
  }, []);

  const uploadFile = useCallback(
    async (
      file: File,
      onProgress?: (progress: number) => void
    ): Promise<MessageAttachment | null> => {
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        const form = new FormData();
        form.append("file", file);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            if (data.ok) {
              resolve({
                url: data.url,
                type: data.type === "audio" ? "voice" : (data.type as MessageAttachment["type"]),
                mimeType: data.mimeType,
                originalName: data.name,
                size: data.size,
                width: data.width,
                height: data.height,
              });
              return;
            }
          }
          let err = "Upload mislukt.";
          try {
            err = JSON.parse(xhr.responseText || "{}").error || err;
          } catch {}
          resolve(null);
        });

        xhr.addEventListener("error", () => resolve(null));
        xhr.addEventListener("abort", () => resolve(null));
        xhr.open("POST", "/api/upload");
        xhr.send(form);
      });
    },
    []
  );

  const updateAttachment = useCallback(
    (id: string, patch: Partial<PendingAttachment>) => {
      setPendingAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    },
    []
  );

  const removeAttachment = useCallback((id: string) => {
    setPendingAttachments((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item?.localUrl) URL.revokeObjectURL(item.localUrl);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const handleSelectFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const newAttachments: PendingAttachment[] = [];
      for (const file of Array.from(files)) {
        const localUrl = URL.createObjectURL(file);
        const type: MessageAttachment["type"] = file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
          ? "video"
          : "document";
        const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const item: PendingAttachment = {
          id,
          file,
          localUrl,
          type,
          mimeType: file.type,
          originalName: file.name,
          size: file.size,
          status: "uploading",
          progress: 0,
        };
        newAttachments.push(item);
      }
      setPendingAttachments((prev) => [...prev, ...newAttachments]);

      for (const item of newAttachments) {
        const attachment = await uploadFile(item.file, (progress) =>
          updateAttachment(item.id, { progress })
        );
        if (!attachment) {
          updateAttachment(item.id, { status: "error", error: "Upload mislukt." });
          continue;
        }
        updateAttachment(item.id, { status: "done", attachment });
      }
    },
    [uploadFile, updateAttachment]
  );

  const moveAttachment = useCallback((id: string, direction: -1 | 1) => {
    setPendingAttachments((prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      if (idx < 0) return prev;
      const next = idx + direction;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  }, []);

  const retryAttachment = useCallback(
    async (id: string) => {
      const item = pendingAttachments.find((a) => a.id === id);
      if (!item) return;
      updateAttachment(id, { status: "uploading", progress: 0, error: undefined });
      const attachment = await uploadFile(item.file, (progress) =>
        updateAttachment(id, { progress })
      );
      if (!attachment) {
        updateAttachment(id, { status: "error", error: "Upload mislukt." });
        return;
      }
      updateAttachment(id, { status: "done", attachment });
    },
    [pendingAttachments, uploadFile, updateAttachment]
  );

  const hasPendingUploads = pendingAttachments.some((a) => a.status === "uploading");
  const hasReadyAttachments = pendingAttachments.some((a) => a.status === "done");
  const draftText = draft.trim();
  const canSend = draftText.length > 0 || hasReadyAttachments;

  const sendComposer = useCallback(async () => {
    if (sending || hasPendingUploads) return;
    const hasCaption = draft.trim().length > 0;
    const ready = pendingAttachments.filter((a) => a.status === "done");

    if (ready.length > 0 || hasCaption) {
      const attachmentsMeta = ready.map((a) => ({ ...a.attachment! }));
      const meta = attachmentsMeta.length > 0 ? JSON.stringify(attachmentsMeta) : undefined;
      const body = hasCaption ? draft.trim() : attachmentsMeta.length > 0 ? "Bijlage" : "";
      const localUrlsToRevoke = ready.map((a) => a.localUrl);
      setSending(true);
      setDraft("");
      setPendingAttachments((prev) => prev.filter((a) => !ready.some((r) => r.id === a.id)));
      const tempId = `optimistic-${Date.now()}`;
      insertOptimistic({
        id: tempId,
        fromMe: true,
        kind: "text",
        body,
        meta,
        time: new Date().toISOString(),
        status: "sending",
      });
      const res = await sendMessage(conversation.id, { kind: "text", body, meta });
      setSending(false);
      localUrlsToRevoke.forEach((url) => URL.revokeObjectURL(url));
      if (res.ok) {
        replaceOptimistic(tempId, {
          id: res.id ?? tempId,
          fromMe: true,
          kind: "text",
          body,
          meta,
          time: new Date().toISOString(),
          status: "sent",
        });
      } else {
        failOptimistic(tempId);
      }
    }
  }, [draft, sending, hasPendingUploads, pendingAttachments, conversation.id, insertOptimistic, replaceOptimistic, failOptimistic]);

  const retryMessage = useCallback(
    async (message: Message) => {
      if (!message.fromMe || message.status !== "failed") return;
      const tempId = message.id;
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: "sending" } : m)));
      const res = await sendMessage(conversation.id, {
        kind: message.kind,
        body: message.body,
        meta: message.meta,
      });
      if (res.ok) {
        replaceOptimistic(tempId, { ...message, id: res.id ?? tempId, status: "sent" });
      } else {
        failOptimistic(tempId);
      }
    },
    [conversation.id, replaceOptimistic, failOptimistic]
  );

  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendComposer();
    }
  };

  // Chat management handlers
  const handleArchive = useCallback(async () => {
    setActionLoading(true);
    const res = await archiveChat(conversation.id);
    setActionLoading(false);
    setShowArchiveModal(false);
    if (res.ok) {
      router.push("/messages");
    }
  }, [conversation.id, router]);

  const handleMute = useCallback(async (duration: "1h" | "8h" | "24h" | "7d" | "30d" | "indefinite") => {
    setActionLoading(true);
    const res = await muteChat(conversation.id, duration);
    setActionLoading(false);
    setShowMuteSubmenu(false);
    setShowChatMenu(false);
    if (res.ok) {
      setMuted(true);
      setMuteIndefinite(duration === "indefinite");
      if (duration !== "indefinite") {
        const hours = { "1h": 1, "8h": 8, "24h": 24, "7d": 168, "30d": 720 } as const;
        setMutedUntil(new Date(Date.now() + hours[duration] * 3600_000).toISOString());
      } else {
        setMutedUntil(undefined);
      }
    }
  }, [conversation.id]);

  const handleUnmute = useCallback(async () => {
    setActionLoading(true);
    await unmuteChat(conversation.id);
    setActionLoading(false);
    setShowChatMenu(false);
    setMuted(false);
    setMuteIndefinite(false);
    setMutedUntil(undefined);
  }, [conversation.id]);

  const handleBlock = useCallback(async () => {
    setActionLoading(true);
    const res = await blockContact(conversation.companyId);
    setActionLoading(false);
    setShowBlockModal(false);
    setShowChatMenu(false);
    if (res.ok) setBlocked(true);
  }, [conversation.companyId]);

  const handleUnblock = useCallback(async () => {
    setActionLoading(true);
    const res = await unblockContact(conversation.companyId);
    setActionLoading(false);
    if (res.ok) setBlocked(false);
  }, [conversation.companyId]);

  const handleReport = useCallback(async (reason: string, details: string, includeMessages: boolean) => {
    setActionLoading(true);
    const res = await reportContact({
      reportedId: conversation.companyId,
      conversationId: conversation.id,
      reason: reason as any,
      details: details || undefined,
      includeMessages,
    });
    setActionLoading(false);
    return res;
  }, [conversation.companyId, conversation.id]);

  // Menu outside click + escape
  useEffect(() => {
    if (!showChatMenu) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowChatMenu(false);
        setShowMuteSubmenu(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowChatMenu(false);
        setShowMuteSubmenu(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [showChatMenu]);

  // Selection mode escape
  useEffect(() => {
    if (!selectMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectMode(false);
        setSelectedMsgs(new Set());
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectMode]);

  const toggleSelectMsg = useCallback((id: string) => {
    setSelectedMsgs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedMsgs(new Set());
  }, []);

  const insertEmoji = (emoji: string) => {
    editorRef.current?.insertText(emoji);
  };

  const sendBusinessCard = useCallback(async () => {
    const body = `${me.name}`;
    const meta = JSON.stringify({
      name: me.name,
      industry: me.industry,
      city: me.city,
      id: me.id,
      verified: me.verified,
    });
    await sendMessage(conversation.id, { kind: "card", body, meta });
    fetchLatest();
  }, [conversation.id, fetchLatest, me]);

  const startRecording = async () => {
    try {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        audioContextRef.current?.close();
        audioContextRef.current = null;
        analyserRef.current = null;
        if (sampleIntervalRef.current) clearInterval(sampleIntervalRef.current);
        const blob = new Blob(chunks, { type: mimeType });
        setRecording((r) => ({
          ...r,
          state: "preview",
          blob,
          url: URL.createObjectURL(blob),
          mediaRecorder: null,
        }));
      };
      mediaRecorder.start(200);
      const sampleRate = prefersReduced ? 500 : 100;
      sampleIntervalRef.current = setInterval(() => {
        const a = analyserRef.current;
        if (!a) return;
        const amp = getAmplitude(a);
        setRecording((r) => ({ ...r, samples: [...r.samples, amp] }));
      }, sampleRate);
      recordingTimer.current = setInterval(() => {
        setRecording((r) => ({ ...r, time: r.time + 1 }));
      }, 1000);
      setRecording({ state: "recording", time: 0, chunks, mediaRecorder, blob: null, url: null, samples: [] });
    } catch {
      setRecording({ state: "idle", time: 0, chunks: [], mediaRecorder: null, blob: null, url: null, samples: [], error: "Microfoontoegang geweigerd. Controleer je browserinstellingen." });
    }
  };

  const pauseRecording = () => {
    recording.mediaRecorder?.pause();
    audioContextRef.current?.suspend();
    if (sampleIntervalRef.current) clearInterval(sampleIntervalRef.current);
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    setRecording((r) => ({ ...r, state: "paused" }));
  };

  const resumeRecording = () => {
    recording.mediaRecorder?.resume();
    audioContextRef.current?.resume();
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sampleRate = prefersReduced ? 500 : 100;
    sampleIntervalRef.current = setInterval(() => {
      const a = analyserRef.current;
      if (!a) return;
      const amp = getAmplitude(a);
      setRecording((r) => ({ ...r, samples: [...r.samples, amp] }));
    }, sampleRate);
    recordingTimer.current = setInterval(() => {
      setRecording((r) => ({ ...r, time: r.time + 1 }));
    }, 1000);
    setRecording((r) => ({ ...r, state: "recording" }));
  };

  const stopRecording = () => {
    recording.mediaRecorder?.stop();
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    if (sampleIntervalRef.current) clearInterval(sampleIntervalRef.current);
  };

  const cancelRecording = () => {
    const recorder = recording.mediaRecorder;
    if (recorder) recorder.onstop = null;
    recorder?.stop();
    recorder?.stream.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    if (sampleIntervalRef.current) clearInterval(sampleIntervalRef.current);
    if (recording.url) URL.revokeObjectURL(recording.url);
    setRecording({ state: "idle", time: 0, chunks: [], mediaRecorder: null, blob: null, url: null, samples: [] });
  };

  const togglePreview = () => {
    const audio = previewAudioRef.current;
    if (!audio) return;
    if (previewPlaying) audio.pause();
    else audio.play();
  };

  const sendRecording = async () => {
    if (!recording.blob) return;
    const file = new File([recording.blob], `voice-${Date.now()}.webm`, { type: recording.blob.type });
    const durationMs = recording.time * 1000;
    const attachment = await uploadFile(file);
    if (!attachment) return;
    const meta = JSON.stringify({ ...attachment, duration: durationMs, samples: recording.samples });
    const body = "Spraakbericht";
    const tempId = `optimistic-${Date.now()}`;
    insertOptimistic({ id: tempId, fromMe: true, kind: "voice", body, meta, time: new Date().toISOString(), status: "sending" });
    const res = await sendMessage(conversation.id, { kind: "voice", body, meta });
    if (res.ok) {
      replaceOptimistic(tempId, { id: res.id ?? tempId, fromMe: true, kind: "voice", body, meta, time: new Date().toISOString(), status: "sent" });
    } else {
      failOptimistic(tempId);
    }
    cancelRecording();
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    e.target.value = "";
    if (files) handleSelectFiles(files);
  };

  if (!company) return null;

  const messageGroups = groupMessages(messages);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <Link href="/messages" className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 lg:hidden press">
          <ArrowLeft size={18} />
        </Link>
        <Link href={`/company/${company.id}`}>
          <CompanyAvatar name={company.name} color={company.logoColor} logoUrl={company.logoUrl} size={46} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-semibold">{company.name}</span>
            {company.verified && <VerifiedBadge size={14} />}
          </div>
          <p className="truncate text-xs text-muted">{company.industry} · {company.city}</p>
        </div>
        <div className="flex items-center gap-1">
          {muted && (
            <div className="grid h-10 w-10 place-items-center rounded-full text-muted" title="Meldingen gedempt">
              <BellOff size={18} />
            </div>
          )}
          <button
            onClick={() => call.startCall("audio")}
            disabled={call.callState !== "idle" || blocked}
            title="Audiogesprek starten"
            aria-label="Audiogesprek starten"
            className="hidden h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 disabled:opacity-40 sm:grid"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={() => call.startCall("video")}
            disabled={call.callState !== "idle" || blocked}
            title="Videogesprek starten"
            aria-label="Videogesprek starten"
            className="hidden h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 disabled:opacity-40 sm:grid"
          >
            <Video size={20} />
          </button>
          {/* Mobile call buttons */}
          <div className="relative sm:hidden">
            <button
              onClick={() => setShowHeaderMore((v) => !v)}
              title="Bellen"
              aria-label="Bellen"
              className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2"
            >
              <Phone size={20} />
            </button>
            {showHeaderMore && (
              <div className="absolute right-0 top-full z-30 mt-2 flex gap-1 rounded-2xl border border-border bg-surface p-1.5 shadow-lg">
                <button
                  onClick={() => { setShowHeaderMore(false); call.startCall("audio"); }}
                  disabled={call.callState !== "idle" || blocked}
                  title="Audiogesprek starten"
                  aria-label="Audiogesprek starten"
                  className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 disabled:opacity-40"
                >
                  <Phone size={20} />
                </button>
                <button
                  onClick={() => { setShowHeaderMore(false); call.startCall("video"); }}
                  disabled={call.callState !== "idle" || blocked}
                  title="Videogesprek starten"
                  aria-label="Videogesprek starten"
                  className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 disabled:opacity-40"
                >
                  <Video size={20} />
                </button>
              </div>
            )}
          </div>
          {/* Chat management menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowChatMenu((v) => !v)}
              title="Meer opties"
              aria-label="Meer opties"
              className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2"
            >
              <MoreVertical size={20} />
            </button>
            <AnimatePresence>
              {showChatMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-surface py-1.5 shadow-xl"
                >
                  <ChatMenuItem icon={Info} label="Contactinformatie" onClick={() => { setShowChatMenu(false); setShowContactPanel(true); }} />
                  <ChatMenuItem icon={CheckSquare} label="Berichten selecteren" onClick={() => { setShowChatMenu(false); setSelectMode(true); }} />
                  {muted ? (
                    <ChatMenuItem icon={Bell} label="Dempen opheffen" onClick={handleUnmute} />
                  ) : (
                    <ChatMenuItem icon={BellOff} label="Meldingen dempen" hasSubmenu onClick={() => setShowMuteSubmenu((v) => !v)} />
                  )}
                  {showMuteSubmenu && !muted && (
                    <div className="border-t border-border py-1">
                      {[
                        { label: "1 uur", val: "1h" as const },
                        { label: "8 uur", val: "8h" as const },
                        { label: "24 uur", val: "24h" as const },
                        { label: "7 dagen", val: "7d" as const },
                        { label: "30 dagen", val: "30d" as const },
                        { label: "Tot ik het ophef", val: "indefinite" as const },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          onClick={() => handleMute(opt.val)}
                          disabled={actionLoading}
                          className="flex w-full items-center px-4 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-50"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="my-1 h-px bg-border" />
                  <ChatMenuItem icon={LogOut} label="Chat sluiten" onClick={() => { setShowChatMenu(false); setShowArchiveModal(true); }} />
                  <ChatMenuItem icon={Ban} label="Contact blokkeren" destructive onClick={() => { setShowChatMenu(false); setShowBlockModal(true); }} />
                  <ChatMenuItem icon={Flag} label="Contact rapporteren" destructive onClick={() => { setShowChatMenu(false); setShowReportModal(true); }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {needBody && (
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
          {needType && <TypeBadge type={needType as PostType} size="sm" />}
          <span className="line-clamp-1 flex-1 text-sm text-muted">Betreft: {needBody}</span>
        </div>
      )}

      {blocked && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-red-50 px-4 py-2.5 dark:bg-red-950/20">
          <span className="text-sm font-medium text-red-700 dark:text-red-400">Je hebt dit contact geblokkeerd.</span>
          <button
            onClick={handleUnblock}
            disabled={actionLoading}
            className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            Blokkering opheffen
          </button>
        </div>
      )}

      {selectMode && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-4 py-2">
          <span className="text-sm font-medium">{selectedMsgs.size} geselecteerd</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const texts = messages.filter((m) => selectedMsgs.has(m.id) && m.kind === "text" && m.body).map((m) => m.body);
                if (texts.length) navigator.clipboard.writeText(texts.join("\n"));
              }}
              disabled={selectedMsgs.size === 0}
              className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 disabled:opacity-40"
              title="Kopiëren"
            >
              <Copy size={16} />
            </button>
            <button
              disabled={selectedMsgs.size === 0}
              className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 disabled:opacity-40"
              title="Doorsturen"
            >
              <Forward size={16} />
            </button>
            <button
              disabled={selectedMsgs.size === 0}
              className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 disabled:opacity-40"
              title="Vastpinnen"
            >
              <Pin size={16} />
            </button>
            <button
              disabled={selectedMsgs.size === 0}
              className="grid h-8 w-8 place-items-center rounded-full text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-950/20"
              title="Verwijderen"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={exitSelectMode}
              className="ml-1 rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted transition-colors hover:bg-surface-3"
            >
              Selecteren stoppen
            </button>
          </div>
        </div>
      )}

      {/* Call panel + Messages + Composer container */}
      <div ref={callContainerRef} className="flex min-h-0 flex-1 flex-col">
        {/* Call panel (inline, above messages) */}
        {call.callState !== "idle" && call.callState !== "incoming" && !callMinimized && !callFullscreen && (
          <>
            <div style={{ height: `${callHeightPct * 100}%` }} className="shrink-0 overflow-hidden">
              <CallPanel
                call={call}
                company={company}
                me={me}
                onMinimize={() => setCallMinimized(true)}
                onToggleFullscreen={() => setCallFullscreen(true)}
                className="h-full"
              />
            </div>
            <ResizeHandle onResize={handleCallResize} onDoubleClick={resetCallHeight} />
          </>
        )}

        {/* Compact call bar (minimized) */}
        {call.callState !== "idle" && call.callState !== "incoming" && callMinimized && (
          <div className="shrink-0 p-2">
            <CompactCallBar
              call={call}
              company={company}
              onExpand={() => setCallMinimized(false)}
              onEndCall={call.endCall}
            />
          </div>
        )}

        {/* Fullscreen call overlay */}
        {call.callState !== "idle" && call.callState !== "incoming" && callFullscreen && (
          <div className="fixed inset-0 z-[1000] flex flex-col bg-[#0a0a0a]">
            <CallPanel
              call={call}
              company={company}
              me={me}
              onMinimize={() => { setCallFullscreen(false); setCallMinimized(true); }}
              onToggleFullscreen={() => setCallFullscreen(false)}
              isFullscreen
              className="h-full"
            />
          </div>
        )}

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto px-4 py-4"
      >
        {hasMore && (
          <div className="mb-4 flex justify-center">
            <button
              onClick={loadOlder}
              disabled={loadingMore}
              className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-surface-2"
            >
              {loadingMore ? "Laden…" : "Oudere berichten laden"}
            </button>
          </div>
        )}

        {messageGroups.map((group, gi) => (
          <div key={group.date + gi} className="space-y-3">
            <div className="sticky top-2 z-10 flex justify-center">
              <span className="rounded-full bg-surface-2 px-3 py-1 text-[11px] font-medium text-muted shadow-sm">
                {formatDate(group.date)}
              </span>
            </div>
            {group.items.map((item, ii) =>
              item.type === "unread" ? (
                <div key={`unread-${ii}`} className="flex items-center gap-3 py-2">
                  <div className="h-px flex-1 bg-brand/30" />
                  <span className="text-[11px] font-semibold text-brand">Nieuwe berichten</span>
                  <div className="h-px flex-1 bg-brand/30" />
                </div>
              ) : (
                <Bubble
                  key={item.message.id}
                  message={item.message}
                  onRetry={() => retryMessage(item.message)}
                  selectMode={selectMode}
                  selected={selectedMsgs.has(item.message.id)}
                  onToggleSelect={() => toggleSelectMsg(item.message.id)}
                />
              )
            )}
          </div>
        ))}

        {showScrollButton && (
          <div className="sticky bottom-4 z-20 flex justify-center">
            <button
              onClick={() => {
                scrollToBottom();
                setShowScrollButton(false);
              }}
              className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background shadow-lg transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              Nieuwe berichten <ChevronDown size={14} className="ml-1 inline" />
            </button>
          </div>
        )}
      </div>

      {/* Composer */}
      {blocked ? (
        <div className="shrink-0 border-t border-border bg-surface p-4 text-center">
          <p className="text-sm text-muted">Je kunt geen berichten versturen aan een geblokkeerd contact.</p>
        </div>
      ) : (
      <div className="shrink-0 border-t border-border bg-surface p-3">
        {recording.state === "idle" && pendingAttachments.length > 0 && (
          <div className="mb-2 flex gap-2 overflow-x-auto rounded-xl border border-border bg-background p-2">
            {pendingAttachments.map((a, idx) => (
              <div
                key={a.id}
                className="group relative flex w-28 shrink-0 flex-col gap-1 rounded-lg border border-border bg-surface p-1.5"
              >
                <div className="relative aspect-square overflow-hidden rounded-md bg-surface-2">
                  {a.type === "image" ? (
                    <img
                      src={a.localUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : a.type === "video" ? (
                    <div className="grid h-full w-full place-items-center">
                      <Video size={24} className="text-muted" />
                    </div>
                  ) : (
                    <div className="grid h-full w-full place-items-center">
                      <FileText size={24} className="text-muted" />
                    </div>
                  )}
                  {a.status === "uploading" && (
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-surface-2">
                      <div
                        className="h-full bg-brand transition-all"
                        style={{ width: `${a.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <p className="truncate px-1 text-[10px] text-muted">{a.originalName}</p>
                <div className="flex items-center justify-center gap-0.5 opacity-60 group-hover:opacity-100">
                  <button
                    onClick={() => moveAttachment(a.id, -1)}
                    disabled={idx === 0}
                    className="grid h-5 w-5 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 disabled:opacity-30"
                    aria-label="Naar links"
                  >
                    <ChevronUp size={12} className="-rotate-90" />
                  </button>
                  <button
                    onClick={() => moveAttachment(a.id, 1)}
                    disabled={idx === pendingAttachments.length - 1}
                    className="grid h-5 w-5 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 disabled:opacity-30"
                    aria-label="Naar rechts"
                  >
                    <ChevronDown size={12} className="-rotate-90" />
                  </button>
                  <button
                    onClick={() =>
                      setLightboxAttachment(
                        a.attachment
                          ? { ...a.attachment, type: a.type, mimeType: a.mimeType, originalName: a.originalName, size: a.size }
                          : { url: a.localUrl, type: a.type, mimeType: a.mimeType, originalName: a.originalName, size: a.size }
                      )
                    }
                    className="grid h-5 w-5 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2"
                    aria-label="Voorbeeld bekijken"
                  >
                    <Eye size={12} />
                  </button>
                  {a.status === "error" ? (
                    <button
                      onClick={() => retryAttachment(a.id)}
                      className="grid h-5 w-5 place-items-center rounded-full text-red-500 transition-colors hover:bg-surface-2"
                      aria-label="Opnieuw proberen"
                    >
                      <RotateCcw size={12} />
                    </button>
                  ) : (
                    <button
                      onClick={() => removeAttachment(a.id)}
                      className="grid h-5 w-5 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2"
                      aria-label="Verwijderen"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-surface text-[10px] font-medium text-muted transition-colors hover:bg-surface-2"
            >
              <Paperclip size={18} />
              Meer toevoegen
            </button>
          </div>
        )}

        {recording.error && (
          <p className="mb-2 text-xs text-red-500">{recording.error}</p>
        )}

        <div
          className={cn(
            "relative rounded-2xl border border-border bg-background p-2 transition-colors focus-within:border-border-strong",
            recording.state !== "idle" && "border-red-300/50 bg-red-50/30 dark:border-red-900/30 dark:bg-red-950/10"
          )}
        >
          {recording.state === "idle" ? (
            <RichTextEditor
              ref={editorRef}
              value={draft}
              onChange={setDraft}
              placeholder="Schrijf een bericht…"
              compact
              onKeyDown={handleEditorKeyDown}
            />
          ) : recording.state === "preview" ? (
            <div className="flex items-center gap-3 px-2 py-1">
              <button
                onClick={togglePreview}
                className="grid h-9 w-9 place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand/90"
                aria-label={previewPlaying ? "Pauze" : "Beluisteren"}
              >
                {previewPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              </button>
              <div className="min-w-0 flex-1">
                <VoiceWaveform
                  samples={recording.samples}
                  progress={previewProgress}
                  barCount={48}
                  className="h-8 text-foreground/70"
                />
              </div>
              <span className="text-xs font-medium text-muted">{formatDuration(recording.time)}</span>
              <button
                onClick={cancelRecording}
                className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2"
                aria-label="Verwijderen"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={sendRecording}
                className="shimmer grid h-9 w-9 place-items-center rounded-full bg-foreground text-background shadow-lg"
                aria-label="Verzenden"
              >
                <Send size={18} />
              </button>
              <audio
                ref={previewAudioRef}
                src={recording.url ?? undefined}
                onPlay={() => setPreviewPlaying(true)}
                onPause={() => setPreviewPlaying(false)}
                onEnded={() => setPreviewPlaying(false)}
                onTimeUpdate={(e) =>
                  setPreviewProgress(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0)
                }
                preload="metadata"
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 px-2 py-1">
              <button
                onClick={cancelRecording}
                className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2"
                aria-label="Annuleren"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-full w-full rounded-full bg-red-500" />
                </span>
                <span className="text-xs font-medium text-muted">{formatDuration(recording.time)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <VoiceWaveform
                  samples={recording.samples}
                  barCount={48}
                  scrolling
                  className="h-8 text-foreground/70"
                />
              </div>
              {recording.state === "recording" ? (
                <button
                  onClick={pauseRecording}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2"
                  aria-label="Pauzeren"
                >
                  <Pause size={18} />
                </button>
              ) : (
                <button
                  onClick={resumeRecording}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2"
                  aria-label="Doorgaan"
                >
                  <Play size={18} className="ml-0.5" />
                </button>
              )}
              <button
                onClick={stopRecording}
                className="grid h-9 w-9 place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand/90"
                aria-label="Stoppen"
              >
                <Check size={20} />
              </button>
            </div>
          )}
        </div>

        {recording.state === "idle" && (
          <div className="mt-2 flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1">
              {/* Desktop actions */}
              <div className="hidden items-center gap-1 sm:flex">
                <ActionButton
                  icon={<ImageIcon size={20} strokeWidth={1.8} />}
                  label="Foto toevoegen"
                  onClick={() => photoInputRef.current?.click()}
                />
                <ActionButton
                  icon={<Video size={20} strokeWidth={1.8} />}
                  label="Video toevoegen"
                  onClick={() => videoInputRef.current?.click()}
                />
                <ActionButton
                  icon={<FileUp size={20} strokeWidth={1.8} />}
                  label="Bestand toevoegen"
                  onClick={() => docInputRef.current?.click()}
                />
                <ActionButton
                  icon={<Paperclip size={20} strokeWidth={1.8} />}
                  label="Bijlage toevoegen"
                  onClick={() => fileInputRef.current?.click()}
                />
                <ActionButton
                  icon={<Briefcase size={20} strokeWidth={1.8} />}
                  label="Bedrijfskaart delen"
                  onClick={sendBusinessCard}
                />
                <div className="relative">
                  <ActionButton
                    icon={<Smile size={20} strokeWidth={1.8} />}
                    label="Emoji toevoegen"
                    onClick={() => setShowEmoji((v) => !v)}
                  />
                  {showEmoji && (
                    <div className="absolute bottom-12 left-0 z-40 rounded-2xl border border-border bg-surface shadow-2xl">
                      <EmojiPicker
                        onEmojiClick={(emoji: EmojiClickData) => {
                          insertEmoji(emoji.emoji);
                          setShowEmoji(false);
                        }}
                      />
                    </div>
                  )}
                </div>
                <ActionButton
                  icon={<Mic size={20} strokeWidth={1.8} />}
                  label="Spraakbericht opnemen"
                  onClick={startRecording}
                />
              </div>

              {/* Mobile actions */}
              <div className="flex items-center gap-1 sm:hidden">
                <ActionButton
                  icon={<ImageIcon size={20} strokeWidth={1.8} />}
                  label="Foto toevoegen"
                  onClick={() => photoInputRef.current?.click()}
                />
                <ActionButton
                  icon={<FileUp size={20} strokeWidth={1.8} />}
                  label="Bestand toevoegen"
                  onClick={() => docInputRef.current?.click()}
                />
                <div className="relative">
                  <ActionButton
                    icon={<Smile size={20} strokeWidth={1.8} />}
                    label="Emoji toevoegen"
                    onClick={() => setShowEmoji((v) => !v)}
                  />
                  {showEmoji && (
                    <div className="absolute bottom-12 left-0 z-40 rounded-2xl border border-border bg-surface shadow-2xl">
                      <EmojiPicker
                        onEmojiClick={(emoji: EmojiClickData) => {
                          insertEmoji(emoji.emoji);
                          setShowEmoji(false);
                        }}
                      />
                    </div>
                  )}
                </div>
                <ActionButton
                  icon={<Mic size={20} strokeWidth={1.8} />}
                  label="Spraakbericht opnemen"
                  onClick={startRecording}
                />
                <div className="relative">
                  <ActionButton
                    icon={<MoreHorizontal size={20} strokeWidth={1.8} />}
                    label="Meer opties"
                    onClick={() => setShowMore((v) => !v)}
                  />
                  {showMore && (
                    <div className="absolute bottom-10 left-0 z-30 flex w-max gap-1 rounded-2xl border border-border bg-surface p-1.5 shadow-lg">
                      <ActionButton
                        icon={<Video size={20} strokeWidth={1.8} />}
                        label="Video toevoegen"
                        onClick={() => {
                          setShowMore(false);
                          videoInputRef.current?.click();
                        }}
                      />
                      <ActionButton
                        icon={<Paperclip size={20} strokeWidth={1.8} />}
                        label="Bijlage toevoegen"
                        onClick={() => {
                          setShowMore(false);
                          fileInputRef.current?.click();
                        }}
                      />
                      <ActionButton
                        icon={<Briefcase size={20} strokeWidth={1.8} />}
                        label="Bedrijfskaart delen"
                        onClick={() => {
                          setShowMore(false);
                          sendBusinessCard();
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onFileSelect(e)}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
                onChange={(e) => onFileSelect(e)}
              />
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                multiple
                className="hidden"
                onChange={(e) => onFileSelect(e)}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                multiple
                className="hidden"
                onChange={(e) => onFileSelect(e)}
              />
            </div>

            {canSend && (
              <button
                onClick={sendComposer}
                disabled={sending || hasPendingUploads}
                title="Verstuur bericht"
                aria-label="Verstuur bericht"
                className="shimmer grid h-10 w-10 shrink-0 place-items-center rounded-full bg-foreground text-background shadow-lg transition-transform active:scale-95 disabled:opacity-60 press"
              >
                <Send size={18} />
              </button>
            )}
          </div>
        )}

      </div>
      )}

      </div>{/* end callContainerRef */}

      {call.callState === "incoming" && (
        <IncomingCallOverlay call={call} company={company} me={me} />
      )}

      {lightboxAttachment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setLightboxAttachment(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxAttachment(null)}
              className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
              aria-label="Sluiten"
            >
              <X size={18} />
            </button>
            {lightboxAttachment.type === "image" ? (
              <img
                src={lightboxAttachment.url}
                alt=""
                className="max-h-[80vh] w-full object-contain"
              />
            ) : lightboxAttachment.type === "video" ? (
              <video
                src={lightboxAttachment.url}
                controls
                className="max-h-[80vh] w-full"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 py-16">
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-surface-2">
                  <FileText size={40} className="text-muted" />
                </div>
                <p className="font-medium">{lightboxAttachment.originalName}</p>
                <p className="text-sm text-muted">{formatFileSize(lightboxAttachment.size)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Archive modal */}
      <ConfirmModal
        open={showArchiveModal}
        title="Chat sluiten?"
        body="Deze chat verdwijnt uit je gesprekkenlijst. De berichtgeschiedenis wordt niet verwijderd."
        confirmLabel="Chat sluiten"
        cancelLabel="Annuleren"
        loading={actionLoading}
        onConfirm={handleArchive}
        onCancel={() => setShowArchiveModal(false)}
      />

      {/* Block modal */}
      <ConfirmModal
        open={showBlockModal}
        title="Contact blokkeren?"
        body="Dit contact kan je geen nieuwe berichten of oproepen meer sturen. Je kunt de blokkering later opheffen."
        confirmLabel="Blokkeren"
        cancelLabel="Annuleren"
        loading={actionLoading}
        destructive
        onConfirm={handleBlock}
        onCancel={() => setShowBlockModal(false)}
      />

      {/* Report modal */}
      <ReportModal
        open={showReportModal}
        loading={actionLoading}
        onSubmit={handleReport}
        onClose={() => setShowReportModal(false)}
        onBlockAfter={() => { setShowReportModal(false); setShowBlockModal(true); }}
      />

      {/* Contact info panel */}
      <ContactInfoPanel
        open={showContactPanel}
        company={company}
        messages={messages}
        onClose={() => setShowContactPanel(false)}
      />
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-full p-2 text-muted transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {icon}
    </button>
  );
}

function Bubble({
  message,
  onRetry,
  selectMode,
  selected,
  onToggleSelect,
}: {
  message: Message;
  onRetry: () => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const { fromMe } = message;
  const time = new Date(message.time).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (message.kind === "system") {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-surface-2 px-3 py-1 text-xs text-muted">{message.body}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", fromMe ? "justify-end" : "justify-start")}>
      {selectMode && (
        <button
          onClick={onToggleSelect}
          className={cn(
            "grid h-5 w-5 shrink-0 place-items-center rounded border-2 transition-colors",
            selected ? "border-brand bg-brand text-white" : "border-border bg-transparent"
          )}
        >
          {selected && <Check size={12} strokeWidth={3} />}
        </button>
      )}
      <div
        onClick={selectMode ? onToggleSelect : undefined}
        className={cn(
          "relative max-w-[82%] min-w-0 rounded-2xl px-3.5 py-2.5 transition-opacity",
          fromMe
            ? "rounded-br-md bg-foreground text-background"
            : "rounded-bl-md border border-border bg-surface text-foreground",
          selectMode && selected && "ring-2 ring-brand",
          selectMode && !selected && "opacity-60"
        )}
      >
        <BubbleContent message={message} />
        <div className={cn("mt-1 flex items-center justify-end gap-1 text-[10px]", fromMe ? "text-background/60" : "text-muted")}>
          <span>{time}</span>
          {fromMe && <StatusIcon status={message.status} />}
        </div>
        {message.status === "failed" && fromMe && (
          <button
            onClick={onRetry}
            className="absolute -bottom-6 right-0 flex items-center gap-1 text-xs font-semibold text-red-500"
          >
            <RotateCcw size={12} /> Niet verzonden
          </button>
        )}
      </div>
    </div>
  );
}

function BubbleContent({ message }: { message: Message }) {
  if (message.deleted) {
    return <p className="italic opacity-60">Dit bericht is verwijderd.</p>;
  }
  const attachments = parseAttachments(message.meta);
  const text = message.body;
  switch (message.kind) {
    case "image":
    case "video":
      return (
        <div className="space-y-1.5">
          {text && text !== "Bijlage" && <TextBody body={text} />}
          <MediaAttachment attachment={attachments[0]} />
        </div>
      );
    case "document":
      return (
        <div className="space-y-1.5">
          <DocumentAttachment body={text} attachment={attachments[0]} fromMe={message.fromMe} />
        </div>
      );
    case "voice":
      return <VoiceAttachment meta={message.meta} fromMe={message.fromMe} />;
    case "location":
      return (
        <div className="flex items-center gap-2">
          <MapPin size={18} />
          <span className="text-sm">{text}</span>
        </div>
      );
    case "card":
      return <BusinessCard meta={message.meta} />;
    default:
      return (
        <div className="space-y-1.5">
          {text && text !== "Bijlage" && <TextBody body={text} />}
          {attachments.length > 0 && (
            <div className="grid gap-1.5">
              {attachments.map((a, i) =>
                a.type === "image" || a.type === "video" ? (
                  <MediaAttachment key={i} attachment={a} />
                ) : (
                  <DocumentAttachment key={i} body={a.originalName || "Bijlage"} attachment={a} fromMe={message.fromMe} />
                )
              )}
            </div>
          )}
        </div>
      );
  }
}

function TextBody({ body }: { body: string }) {
  const html = useMemo(() => {
    if (isFormattedBody(body)) return sanitizeHtml(body);
    return sanitizeHtml(convertMarkdownToHtml(body));
  }, [body]);
  return (
    <div
      className="whitespace-pre-wrap text-[15px] leading-relaxed [&_p]:m-0 [&_blockquote]:m-0 [&_ul]:m-0 [&_ol]:m-0 [&_li]:my-0.5 [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function MediaAttachment({ meta, attachment: propAttachment }: { meta?: string; attachment?: MessageAttachment }) {
  const attachment = propAttachment ?? parseMeta(meta);
  if (!attachment) return null;
  if (attachment.type === "video") {
    return (
      <video
        src={attachment.url}
        controls
        playsInline
        preload="metadata"
        className="max-h-[300px] w-auto max-w-full rounded-xl"
      />
    );
  }
  return (
    <img
      src={attachment.url}
      alt=""
      loading="lazy"
      className="max-h-[300px] w-auto max-w-full cursor-pointer rounded-xl object-contain"
      onClick={() => window.open(attachment.url, "_blank")}
    />
  );
}

function DocumentAttachment({
  body,
  meta,
  attachment: propAttachment,
  fromMe,
}: {
  body: string;
  meta?: string;
  attachment?: MessageAttachment;
  fromMe: boolean;
}) {
  const attachment = propAttachment ?? parseMeta(meta);
  const hasCaption = body && body !== attachment?.originalName && body !== "Bijlage";
  return (
    <div className="space-y-1.5">
      <a
        href={attachment?.url || "#"}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
          fromMe ? "border-white/20 bg-white/10" : "border-border bg-surface-2"
        )}
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-black/10">
          <FileText size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{attachment?.originalName || body}</p>
          <p className="truncate text-xs opacity-70">{formatFileSize(attachment?.size)}</p>
        </div>
      </a>
      {hasCaption && <p className="text-[15px] leading-relaxed">{body}</p>}
    </div>
  );
}

let currentlyPlayingAudio: HTMLAudioElement | null = null;

function VoiceAttachment({ meta, fromMe }: { meta?: string; fromMe: boolean }) {
  const attachment = parseMeta(meta);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rate, setRate] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [duration, setDuration] = useState(attachment?.duration || 0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const samples = attachment?.samples || [];

  const prefix = fromMe ? "voice-sent" : "voice-received";

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio || error) return;
    if (playing) {
      audio.pause();
    } else {
      if (currentlyPlayingAudio && currentlyPlayingAudio !== audio) {
        currentlyPlayingAudio.pause();
      }
      currentlyPlayingAudio = audio;
      audio.play().catch(() => setError(true));
    }
  };

  const seek = (fraction: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = fraction * audio.duration;
    setProgress(fraction);
  };

  const formatVoiceDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  const currentDisplay = duration
    ? formatVoiceDuration(duration)
    : "Spraakbericht";

  return (
    <div
      className="flex min-w-[220px] items-center gap-3 rounded-xl px-3 py-2.5"
      style={{ backgroundColor: `var(--${prefix}-bg)` }}
    >
      <button
        onClick={toggle}
        disabled={error}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full shadow-sm transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-40"
        style={{
          backgroundColor: `var(--${prefix}-control-bg)`,
          color: `var(--${prefix}-control)`,
        }}
        aria-label={playing ? "Spraakbericht pauzeren" : "Spraakbericht afspelen"}
      >
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : error ? (
          <AlertCircle size={18} />
        ) : playing ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={16} fill="currentColor" className="ml-0.5" />
        )}
      </button>
      <audio
        ref={audioRef}
        src={attachment?.url}
        onPlay={() => { currentlyPlayingAudio = audioRef.current; setPlaying(true); }}
        onPause={() => setPlaying(false)}
        onEnded={() => { if (currentlyPlayingAudio === audioRef.current) currentlyPlayingAudio = null; setPlaying(false); setProgress(0); }}
        onTimeUpdate={(e) => setProgress(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0)}
        onLoadedMetadata={(e) => {
          setLoading(false);
          setError(false);
          if (!duration && e.currentTarget.duration) {
            setDuration(e.currentTarget.duration * 1000);
          }
        }}
        onError={() => { setLoading(false); setError(true); }}
        preload="metadata"
        className="hidden"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {error ? (
          <div className="flex items-center justify-between py-1">
            <span
              className="text-xs font-medium"
              style={{ color: `var(--${prefix}-text)` }}
            >
              Spraakbericht kon niet worden geladen
            </span>
            <button
              onClick={() => {
                setError(false);
                setLoading(true);
                if (audioRef.current) {
                  audioRef.current.load();
                  audioRef.current.play().catch(() => setError(true));
                }
              }}
              className="rounded px-2 py-0.5 text-xs font-semibold transition-opacity hover:opacity-80"
              style={{
                color: `var(--${prefix}-secondary)`,
                backgroundColor: `var(--${prefix}-control-bg)`,
              }}
            >
              Opnieuw proberen
            </button>
          </div>
        ) : (
          <VoiceWaveform
            samples={samples}
            progress={progress}
            barCount={40}
            onSeek={seek}
            inactiveColor={`var(--${prefix}-wave)`}
            activeColor={`var(--${prefix}-wave-active)`}
            className="h-8"
          />
        )}
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-medium"
            style={{ color: `var(--${prefix}-secondary)` }}
          >
            {currentDisplay}
          </span>
          <button
            onClick={() => {
              const next = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1;
              setRate(next);
              if (audioRef.current) audioRef.current.playbackRate = next;
            }}
            className="rounded px-1.5 py-0.5 text-xs font-semibold transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            style={{
              color: `var(--${prefix}-secondary)`,
              backgroundColor: `var(--${prefix}-control-bg)`,
            }}
            aria-label="Afspeelsnelheid"
          >
            {rate}×
          </button>
        </div>
      </div>
    </div>
  );
}

function BusinessCard({ meta }: { meta?: string }) {
  const data = parseMeta(meta);
  if (!data?.id) return null;
  const subtitle = [data?.industry, data?.city].filter(Boolean).join(" · ");
  return (
    <Link
      href={`/company/${data.id}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-surface-3 px-3.5 py-3 shadow-sm transition-colors hover:bg-surface-2"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-foreground text-background">
        <Briefcase size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {data?.name || "Visitekaartje"}
        </p>
        {subtitle ? (
          <p className="truncate text-xs text-foreground/70">{subtitle}</p>
        ) : null}
      </div>
    </Link>
  );
}

function StatusIcon({ status }: { status: Message["status"] }) {
  if (status === "read") return <CheckCheck size={12} className="text-blue-400" />;
  if (status === "failed") return <AlertCircle size={12} className="text-red-400" />;
  if (status === "sending") return <span className="h-1.5 w-1.5 rounded-full bg-background/60" />;
  return <Check size={12} />;
}

function getAmplitude(analyser: AnalyserNode) {
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / data.length) * 3);
}

function parseMeta(meta?: string): any {
  if (!meta) return null;
  try {
    return JSON.parse(meta);
  } catch {
    return null;
  }
}

function parseAttachments(meta?: string): MessageAttachment[] {
  const data = parseMeta(meta);
  if (!data) return [];
  if (Array.isArray(data)) return data as MessageAttachment[];
  if (data.url) return [data as MessageAttachment];
  return [];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Vandaag";
  if (d.toDateString() === yesterday.toDateString()) return "Gisteren";
  return d.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "short" });
}

function groupMessages(messages: Message[]): { date: string; items: ({ type: "message"; message: Message } | { type: "unread" })[] }[] {
  const groups: { date: string; items: ({ type: "message"; message: Message } | { type: "unread" })[] }[] = [];
  let unreadSeparatorShown = false;
  for (const m of messages) {
    const date = m.time.slice(0, 10);
    let group = groups.find((g) => g.date === date);
    if (!group) {
      group = { date, items: [] };
      groups.push(group);
    }
    if (!m.fromMe && m.status !== "read" && !unreadSeparatorShown) {
      group.items.push({ type: "unread" });
      unreadSeparatorShown = true;
    }
    group.items.push({ type: "message", message: m });
  }
  return groups;
}

/* ----------------------- Chat management components ----------------------- */

function ChatMenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
  hasSubmenu,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  hasSubmenu?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-2",
        destructive ? "text-red-600 dark:text-red-400" : "text-foreground"
      )}
    >
      <Icon size={18} className="shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {hasSubmenu && <ChevronDown size={14} className="text-muted" />}
    </button>
  );
}

function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  loading,
  destructive,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  loading?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50",
              destructive ? "bg-red-600 hover:bg-red-700" : "bg-foreground hover:bg-foreground/90"
            )}
          >
            {loading ? "Bezig…" : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "misleiding", label: "Misleiding" },
  { value: "intimidatie", label: "Intimidatie" },
  { value: "ongepast", label: "Ongepaste inhoud" },
  { value: "verdacht", label: "Verdachte zakelijke activiteit" },
  { value: "fraude", label: "Fraude" },
  { value: "anders", label: "Anders" },
] as const;

function ReportModal({
  open,
  loading,
  onSubmit,
  onClose,
  onBlockAfter,
}: {
  open: boolean;
  loading: boolean;
  onSubmit: (reason: string, details: string, includeMessages: boolean) => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
  onBlockAfter: () => void;
}) {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [includeMessages, setIncludeMessages] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [askBlock, setAskBlock] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setDetails("");
      setIncludeMessages(true);
      setSubmitted(false);
      setAskBlock(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!reason) return;
    const res = await onSubmit(reason, details, includeMessages);
    if (res.ok) {
      setSubmitted(true);
      setAskBlock(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400">
                <Check size={24} />
              </div>
              <h3 className="text-lg font-semibold">Bedankt. Je melding is ontvangen.</h3>
              <p className="text-sm text-muted">We nemen je melding in behandeling.</p>
            </div>
            {askBlock && (
              <div className="mt-6 flex flex-col gap-2">
                <p className="text-center text-sm text-muted">Wil je dit contact ook blokkeren?</p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={onClose}
                    className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2"
                  >
                    Nee
                  </button>
                  <button
                    onClick={onBlockAfter}
                    className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                  >
                    Ja, blokkeren
                  </button>
                </div>
              </div>
            )}
            {!askBlock && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={onClose}
                  className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2"
                >
                  Sluiten
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold">Contact rapporteren</h3>
            <p className="mt-1 text-sm text-muted">Waarom meld je dit contact?</p>
            <div className="mt-4 space-y-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                    reason === r.value
                      ? "border-brand bg-brand/5 text-foreground"
                      : "border-border text-muted hover:bg-surface-2"
                  )}
                >
                  <div className={cn(
                    "grid h-4 w-4 place-items-center rounded-full border-2",
                    reason === r.value ? "border-brand" : "border-border"
                  )}>
                    {reason === r.value && <div className="h-2 w-2 rounded-full bg-brand" />}
                  </div>
                  {r.label}
                </button>
              ))}
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Extra uitleg (optioneel)…"
              rows={3}
              className="mt-4 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-border-strong"
            />
            <label className="mt-3 flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={includeMessages}
                onChange={(e) => setIncludeMessages(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Laatste berichten meesturen als bewijs
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 disabled:opacity-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason || loading}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Bezig…" : "Rapporteren"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function ContactInfoPanel({
  open,
  company,
  messages,
  onClose,
}: {
  open: boolean;
  company: Company;
  messages: Message[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"info" | "media" | "docs" | "links">("info");

  const sharedMedia = useMemo(() => {
    return messages.flatMap((m) => {
      const atts = parseAttachments(m.meta);
      return atts.filter((a: MessageAttachment) => a.type === "image" || a.type === "video");
    });
  }, [messages]);

  const sharedDocs = useMemo(() => {
    return messages.flatMap((m) => {
      const atts = parseAttachments(m.meta);
      return atts.filter((a: MessageAttachment) => a.type === "document");
    });
  }, [messages]);

  const sharedLinks = useMemo(() => {
    const links: string[] = [];
    for (const m of messages) {
      if (m.kind !== "text" || !m.body) continue;
      const matches = m.body.match(/https?:\/\/[^\s)]+/g);
      if (matches) links.push(...matches);
    }
    return links;
  }, [messages]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-semibold">Contactinformatie</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 border-b border-border px-4 py-2">
          {[
            { key: "info", label: "Info" },
            { key: "media", label: "Media" },
            { key: "docs", label: "Docs" },
            { key: "links", label: "Links" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.key ? "bg-foreground text-background" : "text-muted hover:bg-surface-2"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "info" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <CompanyAvatar name={company.name} color={company.logoColor} logoUrl={company.logoUrl} size={72} />
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-semibold">{company.name}</span>
                  {company.verified && <VerifiedBadge size={16} />}
                </div>
                <p className="text-sm text-muted">{company.industry}</p>
              </div>

              <div className="space-y-2 rounded-xl border border-border bg-background p-4">
                <InfoRow icon={Building2} label="Sector" value={company.industry} />
                <InfoRow icon={MapPin} label="Vestigingsplaats" value={company.city} />
                {company.province && <InfoRow icon={MapPin} label="Provincie" value={company.province} />}
                {company.website && <InfoRow icon={Globe} label="Website" value={company.website} link />}
                {company.email && <InfoRow icon={Mail} label="E-mailadres" value={company.email} link />}
                {company.phone && <InfoRow icon={Phone} label="Telefoonnummer" value={company.phone} />}
                {company.description && (
                  <div className="pt-2">
                    <p className="text-xs font-medium text-muted">Omschrijving</p>
                    <p className="mt-1 text-sm">{company.description}</p>
                  </div>
                )}
              </div>

              <Link
                href={`/company/${company.id}`}
                onClick={onClose}
                className="block w-full rounded-full bg-foreground py-2.5 text-center text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
              >
                Bekijk bedrijfsprofiel
              </Link>
            </div>
          )}

          {tab === "media" && (
            <div>
              {sharedMedia.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">Nog geen gedeelde media.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {sharedMedia.map((a, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-lg bg-surface-2">
                      {a.type === "image" ? (
                        <img src={a.url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <video src={a.url} className="h-full w-full object-cover" preload="metadata" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "docs" && (
            <div>
              {sharedDocs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">Nog geen gedeelde documenten.</p>
              ) : (
                <div className="space-y-2">
                  {sharedDocs.map((a, i) => (
                    <a
                      key={i}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition-colors hover:bg-surface-2"
                    >
                      <FileText size={20} className="shrink-0 text-muted" />
                      <span className="flex-1 truncate text-sm">{a.originalName || "Document"}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "links" && (
            <div>
              {sharedLinks.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">Nog geen gedeelde links.</p>
              ) : (
                <div className="space-y-2">
                  {sharedLinks.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition-colors hover:bg-surface-2"
                    >
                      <Globe size={20} className="shrink-0 text-muted" />
                      <span className="flex-1 truncate text-sm">{url}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  link,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  link?: boolean;
}) {
  const content = (
    <div className="flex items-center gap-3">
      <Icon size={16} className="shrink-0 text-muted" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="truncate text-sm">{value}</p>
      </div>
    </div>
  );
  if (link) {
    return (
      <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="block py-1 transition-colors hover:text-brand">
        {content}
      </a>
    );
  }
  return <div className="py-1">{content}</div>;
}
