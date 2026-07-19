"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  startCall as startCallAction,
  acceptCall as acceptCallAction,
  declineCall as declineCallAction,
  endCall as endCallAction,
  getActiveCall,
  sendSignal,
  pollSignals,
} from "@/lib/actions";

type CallState = "idle" | "outgoing" | "incoming" | "connected" | "ending";

type CallKind = "audio" | "video";

interface Signal {
  id: string;
  type: "offer" | "answer" | "ice-candidate" | "hangup";
  payload: unknown;
}

function iceServers() {
  return [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];
}

export function useCall({
  conversationId,
  myCompanyId,
  otherCompanyId,
  enabled = true,
}: {
  conversationId: string;
  myCompanyId: string;
  otherCompanyId: string;
  enabled?: boolean;
}) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callKind, setCallKind] = useState<CallKind | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [remoteSpeaking, setRemoteSpeaking] = useState(false);
  const [statusText, setStatusText] = useState<string>("");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const lastSignalIdRef = useRef<string | undefined>(undefined);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const localAudioCtxRef = useRef<AudioContext | null>(null);
  const remoteAudioCtxRef = useRef<AudioContext | null>(null);
  const speakingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remoteAudioElRef = useRef<HTMLAudioElement | null>(null);
  const senderVideoRef = useRef<RTCRtpSender | null>(null);
  const senderScreenRef = useRef<RTCRtpSender | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const ringCtxRef = useRef<AudioContext | null>(null);
  const sfxCtxRef = useRef<AudioContext | null>(null);

  const getSfxCtx = useCallback(() => {
    if (!sfxCtxRef.current || sfxCtxRef.current.state === "closed") {
      try { sfxCtxRef.current = new AudioContext(); } catch { return null; }
    }
    return sfxCtxRef.current;
  }, []);

  const playTone = useCallback((freqs: number[], duration: number, type: OscillatorType = "sine", volume = 0.15, delay = 0) => {
    const ctx = getSfxCtx();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = type;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    });
  }, [getSfxCtx]);

  const playHangupTone = useCallback(() => {
    playTone([480], 0.15, "sine", 0.12, 0);
    playTone([360], 0.15, "sine", 0.12, 0.12);
    playTone([240], 0.25, "sine", 0.12, 0.24);
  }, [playTone]);

  const playMuteBlip = useCallback((muted: boolean) => {
    if (muted) {
      playTone([800], 0.08, "square", 0.08, 0);
      playTone([600], 0.08, "square", 0.08, 0.06);
    } else {
      playTone([600], 0.08, "square", 0.08, 0);
      playTone([800], 0.08, "square", 0.08, 0.06);
    }
  }, [playTone]);

  const playCameraSound = useCallback(() => {
    playTone([1200], 0.03, "square", 0.06, 0);
    playTone([800], 0.05, "sine", 0.05, 0.04);
  }, [playTone]);

  const stopRingTone = useCallback(() => {
    if (ringTimerRef.current) { clearInterval(ringTimerRef.current); ringTimerRef.current = null; }
    if (ringCtxRef.current) {
      try { ringCtxRef.current.close(); } catch {}
      ringCtxRef.current = null;
    }
  }, []);

  const playRingTone = useCallback(() => {
    stopRingTone();
    try {
      const ctx = new AudioContext();
      ringCtxRef.current = ctx;
      const playRing = () => {
        if (!ringCtxRef.current) return;
        const c = ringCtxRef.current;
        const now = c.currentTime;
        const osc1 = c.createOscillator();
        const osc2 = c.createOscillator();
        const gain = c.createGain();
        osc1.frequency.value = 440;
        osc2.frequency.value = 480;
        osc1.type = "sine";
        osc2.type = "sine";
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
        gain.gain.setValueAtTime(0.12, now + 1.8);
        gain.gain.linearRampToValueAtTime(0, now + 2.0);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(c.destination);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2.0);
        osc2.stop(now + 2.0);
      };
      playRing();
      ringTimerRef.current = setInterval(playRing, 6000);
    } catch {}
  }, [stopRingTone]);

  const stopSpeakingDetection = useCallback(() => {
    if (speakingTimerRef.current) { clearInterval(speakingTimerRef.current); speakingTimerRef.current = null; }
    if (localAudioCtxRef.current) { try { localAudioCtxRef.current.close(); } catch {} localAudioCtxRef.current = null; }
    if (remoteAudioCtxRef.current) { try { remoteAudioCtxRef.current.close(); } catch {} remoteAudioCtxRef.current = null; }
    localAnalyserRef.current = null;
    remoteAnalyserRef.current = null;
    setLocalSpeaking(false);
    setRemoteSpeaking(false);
  }, []);

  const startSpeakingDetection = useCallback(() => {
    stopSpeakingDetection();
    try {
      if (localStream && localStream.getAudioTracks().length > 0) {
        const ctx = new AudioContext();
        localAudioCtxRef.current = ctx;
        const src = ctx.createMediaStreamSource(localStream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.6;
        src.connect(analyser);
        localAnalyserRef.current = analyser;
      }
      if (remoteStream && remoteStream.getAudioTracks().length > 0) {
        const ctx = new AudioContext();
        remoteAudioCtxRef.current = ctx;
        const src = ctx.createMediaStreamSource(remoteStream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.6;
        src.connect(analyser);
        remoteAnalyserRef.current = analyser;
      }
      speakingTimerRef.current = setInterval(() => {
        const checkLevel = (analyser: AnalyserNode | null): number => {
          if (!analyser) return 0;
          const data = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          return sum / data.length / 255;
        };
        const localLevel = checkLevel(localAnalyserRef.current);
        const remoteLevel = checkLevel(remoteAnalyserRef.current);
        setLocalSpeaking(localLevel > 0.08 && micEnabled);
        setRemoteSpeaking(remoteLevel > 0.06);
      }, 100);
    } catch {}
  }, [localStream, remoteStream, micEnabled, stopSpeakingDetection]);

  const cleanup = useCallback(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = null;
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    durationTimerRef.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    stopRingTone();
    stopSpeakingDetection();
    if (sfxCtxRef.current) { try { sfxCtxRef.current.close(); } catch {} sfxCtxRef.current = null; }
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    remoteStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    screenStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setScreenStream(null);
    setIsScreenSharing(false);
    setDuration(0);
    setCallKind(null);
    setCallId(null);
    setCallState("idle");
    setMicEnabled(true);
    setCamEnabled(false);
    setSpeakerEnabled(true);
    setStatusText("");
    lastSignalIdRef.current = undefined;
    senderVideoRef.current = null;
    senderScreenRef.current = null;
  }, [stopRingTone, stopSpeakingDetection]);

  const handleHangup = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Also play hangup tone when remote side hangs up
  const handleRemoteHangup = useCallback(() => {
    playHangupTone();
    cleanup();
  }, [cleanup, playHangupTone]);

  const addPeerConnectionHandlers = useCallback(
    (pc: RTCPeerConnection) => {
      pc.onicecandidate = (e) => {
        if (!e.candidate || !callId) return;
        sendSignal(callId, "ice-candidate", { candidate: e.candidate.toJSON() }).catch(() => {});
      };

      pc.ontrack = (e) => {
        if (e.streams && e.streams[0]) {
          remoteStreamRef.current = e.streams[0];
          setRemoteStream(e.streams[0]);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setError("Verbinding verbroken.");
        }
      };
    },
    [callId]
  );

  const createPeerConnection = useCallback(
    () => {
      const pc = new RTCPeerConnection({ iceServers: iceServers() });
      addPeerConnectionHandlers(pc);
      pcRef.current = pc;
      return pc;
    },
    [addPeerConnectionHandlers]
  );

  const getMedia = useCallback(async (kind: CallKind) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: kind === "video",
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      throw new Error("Microfoon/camera-toegang geweigerd.");
    }
  }, []);

  const startCall = useCallback(
    async (kind: CallKind) => {
      try {
        setError(null);
        const res = await startCallAction(conversationId, kind);
        if (!res.ok || !res.id) {
          setError(res.error || "Oproep starten mislukt.");
          return;
        }
        const id = res.id;
        setCallId(id);
        setCallKind(kind);
        setCallState("outgoing");
        setStatusText("Bellen…");
        setCamEnabled(kind === "video");

        const stream = await getMedia(kind);
        const pc = createPeerConnection();
        stream.getTracks().forEach((t) => {
          const sender = pc.addTrack(t, stream);
          if (t.kind === "video") senderVideoRef.current = sender;
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal(id, "offer", { sdp: offer });

        playRingTone();
        timeoutRef.current = setTimeout(() => {
          stopRingTone();
          setStatusText("Geen antwoord");
          endCallAction(id).catch(() => {});
          handleHangup();
        }, 90000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Oproep starten mislukt.");
        cleanup();
      }
    },
    [conversationId, createPeerConnection, getMedia, cleanup, playRingTone, stopRingTone, handleHangup]
  );

  const acceptCall = useCallback(async () => {
    if (!callId || !callKind) return;
    try {
      const res = await acceptCallAction(callId);
      if (!res.ok) {
        setError(res.error || "Oproep beantwoorden mislukt.");
        return;
      }
      stopRingTone();
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
      setCallState("connected");
      setStatusText("Verbonden");
      durationTimerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Oproep beantwoorden mislukt.");
    }
  }, [callId, callKind, stopRingTone]);

  const declineCall = useCallback(async () => {
    if (!callId) return;
    try {
      await sendSignal(callId, "hangup", {});
      await declineCallAction(callId);
    } catch {}
    playHangupTone();
    handleHangup();
  }, [callId, handleHangup, playHangupTone]);

  const endCall = useCallback(async () => {
    const id = callId;
    if (!id) return;
    try {
      await sendSignal(id, "hangup", {});
      await endCallAction(id);
    } catch {}
    playHangupTone();
    handleHangup();
  }, [callId, handleHangup, playHangupTone]);

  const toggleMic = useCallback(() => {
    const current = localStreamRef.current;
    if (!current) return;
    current.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setMicEnabled((v) => {
      playMuteBlip(!v);
      return !v;
    });
  }, [playMuteBlip]);

  const toggleCam = useCallback(() => {
    const current = localStreamRef.current;
    if (!current) return;
    const videoTracks = current.getVideoTracks();
    if (videoTracks.length > 0) {
      videoTracks.forEach((t) => (t.enabled = !t.enabled));
      setCamEnabled((v) => !v);
    }
  }, []);

  const enableCamera = useCallback(async () => {
    const current = localStreamRef.current;
    if (!current || !pcRef.current) return;
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const videoTrack = videoStream.getVideoTracks()[0];
      if (!videoTrack) return;
      const newStream = new MediaStream([...current.getAudioTracks(), videoTrack]);
      localStreamRef.current = newStream;
      setLocalStream(newStream);
      if (senderVideoRef.current) {
        await senderVideoRef.current.replaceTrack(videoTrack);
      } else {
        const sender = pcRef.current.addTrack(videoTrack, newStream);
        senderVideoRef.current = sender;
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        if (callId) await sendSignal(callId, "offer", { sdp: offer });
      }
      setCamEnabled(true);
      setStatusText("Verbonden");
      playCameraSound();
    } catch {
      setError("Cameratoegang geweigerd.");
    }
  }, [callId, playCameraSound]);

  const disableCamera = useCallback(async () => {
    const current = localStreamRef.current;
    if (!current) return;
    const videoTracks = current.getVideoTracks();
    if (videoTracks.length === 0) return;
    videoTracks.forEach((t) => t.stop());
    const newStream = new MediaStream(current.getAudioTracks());
    localStreamRef.current = newStream;
    setLocalStream(newStream);
    if (senderVideoRef.current && pcRef.current) {
      await senderVideoRef.current.replaceTrack(null);
    }
    setCamEnabled(false);
    playCameraSound();
  }, [playCameraSound]);

  const toggleSpeaker = useCallback(() => {
    setSpeakerEnabled((v) => {
      const next = !v;
      if (remoteAudioElRef.current) remoteAudioElRef.current.muted = !next;
      return next;
    });
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
      setIsScreenSharing(false);
      setStatusText("Verbonden");
      if (senderScreenRef.current && senderVideoRef.current) {
        const videoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (videoTrack) await senderScreenRef.current.replaceTrack(videoTrack);
        else await senderScreenRef.current.replaceTrack(null);
      }
      return;
    }
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) return;
      setScreenStream(displayStream);
      screenStreamRef.current = displayStream;
      setIsScreenSharing(true);
      setStatusText("Scherm wordt gedeeld");
      if (senderVideoRef.current) {
        await senderVideoRef.current.replaceTrack(screenTrack);
        senderScreenRef.current = senderVideoRef.current;
      } else {
        const sender = pc.addTrack(screenTrack, displayStream);
        senderScreenRef.current = sender;
      }
      screenTrack.onended = () => {
        screenStreamRef.current = null;
        setScreenStream(null);
        setIsScreenSharing(false);
        setStatusText("Verbonden");
        if (senderScreenRef.current && senderVideoRef.current) {
          const videoTrack = localStreamRef.current?.getVideoTracks()[0];
          if (videoTrack) senderScreenRef.current.replaceTrack(videoTrack).catch(() => {});
          else senderScreenRef.current.replaceTrack(null).catch(() => {});
        }
      };
    } catch {
      setError("Schermdeling niet toegestaan.");
    }
  }, []);

  // Poll for active calls and signals.
  useEffect(() => {
    if (!enabled || !conversationId || !myCompanyId || !otherCompanyId) return;

    let cancelled = false;

    async function poll() {
      try {
        // If we are not in a call, check for an active call in this conversation.
        if (callState === "idle") {
          const active = await getActiveCall(conversationId);
          if (active && !cancelled) {
            if (active.status === "calling" && active.calleeId === myCompanyId) {
              setCallId(active.id);
              setCallKind(active.kind);
              setCallState("incoming");
            } else if (active.status === "calling" && active.callerId === myCompanyId) {
              setCallId(active.id);
              setCallKind(active.kind);
              setCallState("outgoing");
            } else if (active.status === "connected") {
              setCallId(active.id);
              setCallKind(active.kind);
              setCallState("connected");
            }
          }
          return;
        }

        // If we are in a call (incoming/outgoing/connected), poll signals.
        if (!callId) return;
        const signals = await pollSignals(callId, lastSignalIdRef.current);
        if (cancelled) return;
        for (const s of signals as Signal[]) {
          lastSignalIdRef.current = s.id;
          await handleSignal(s);
        }
      } catch {
        // Ignore polling errors to keep the call UI alive.
      }
    }

    async function handleSignal(s: Signal) {
      const pc = pcRef.current;
      if (s.type === "hangup") {
        stopRingTone();
        handleRemoteHangup();
        return;
      }
      if (s.type === "offer" && callState === "incoming") {
        const payload = s.payload as { sdp: RTCSessionDescriptionInit };
        if (!payload.sdp) return;
        try {
          const stream = await getMedia(callKind!);
          const newPc = createPeerConnection();
          stream.getTracks().forEach((t) => {
            const sender = newPc.addTrack(t, stream);
            if (t.kind === "video") senderVideoRef.current = sender;
          });
          await newPc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await newPc.createAnswer();
          await newPc.setLocalDescription(answer);
          await sendSignal(callId!, "answer", { sdp: answer });
          await acceptCallAction(callId!);
          stopRingTone();
          if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
          setCallState("connected");
          setStatusText("Verbonden");
          durationTimerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Verbinding mislukt.");
          endCall();
        }
        return;
      }
      if (s.type === "answer" && callState === "outgoing" && pc) {
        const payload = s.payload as { sdp: RTCSessionDescriptionInit };
        if (!payload.sdp) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          stopRingTone();
          if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
          setCallState("connected");
          setStatusText("Verbonden");
          durationTimerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Verbinding mislukt.");
          endCall();
        }
        return;
      }
      if (s.type === "ice-candidate" && pc) {
        const payload = s.payload as { candidate: RTCIceCandidateInit };
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch {
          // Ignore stale ICE candidates.
        }
      }
    }

    poll();
    pollTimerRef.current = setInterval(poll, 1200);
    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [enabled, conversationId, myCompanyId, otherCompanyId, callState, callId, callKind, createPeerConnection, getMedia, handleHangup, handleRemoteHangup, endCall, stopRingTone]);

  // Stop duration timer when call ends.
  useEffect(() => {
    if (callState === "idle" || callState === "incoming") {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    }
  }, [callState]);

  // Start speaking detection when streams change during connected call.
  useEffect(() => {
    let cancelled = false;
    if (callState === "connected" && (localStream || remoteStream)) {
      queueMicrotask(() => {
        if (!cancelled) startSpeakingDetection();
      });
    }
    return () => {
      cancelled = true;
      stopSpeakingDetection();
    };
  }, [callState, localStream, remoteStream, startSpeakingDetection, stopSpeakingDetection]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => { cleanup(); };
  }, [cleanup]);

  return {
    callState,
    callKind,
    callId,
    duration,
    localStream,
    remoteStream,
    screenStream,
    isScreenSharing,
    error,
    micEnabled,
    camEnabled,
    speakerEnabled,
    localSpeaking,
    remoteSpeaking,
    statusText,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMic,
    toggleCam,
    enableCamera,
    disableCamera,
    toggleSpeaker,
    toggleScreenShare,
  };
}

export function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
