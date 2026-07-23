"use client";

import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { GoogleSignIn } from "@capawesome/capacitor-google-sign-in";
import { GoogleIcon } from "@/components/google-icon";
import { cn } from "@/lib/utils";

const GOOGLE_ERRORS: Record<string, string> = {
  google_unavailable: "Inloggen met Google is nog niet geconfigureerd.",
  google_invalid_state: "Deze Google-inlog is verlopen. Probeer het opnieuw.",
  google_invalid_response: "Google heeft geen geldige reactie teruggestuurd.",
  google_unverified: "Dit Google-account heeft geen geverifieerd e-mailadres.",
  google_account_conflict: "Dit e-mailadres is al aan een ander Google-account gekoppeld.",
  account_inactive: "Dit account is geschorst of gedeactiveerd. Neem contact op met Vynta.",
  google_failed: "Google-inloggen is niet voltooid. Probeer het opnieuw.",
};

let initializedClientId: string | null = null;

interface GoogleAuthButtonProps {
  className?: string;
  onError?: (message: string) => void;
}

export function GoogleAuthButton({ className, onError }: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const start = async () => {
    onError?.("");
    if (!Capacitor.isNativePlatform()) {
      window.location.assign("/api/auth/google/start");
      return;
    }

    setLoading(true);
    try {
      const configurationResponse = await fetch("/api/auth/google/native/config", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const configuration = (await configurationResponse.json()) as {
        ok?: boolean;
        clientId?: string;
        nonce?: string;
        error?: string;
      };
      if (!configurationResponse.ok || !configuration.ok || !configuration.clientId || !configuration.nonce) {
        throw new Error(configuration.error || "google_unavailable");
      }

      if (initializedClientId !== configuration.clientId) {
        await GoogleSignIn.initialize({ clientId: configuration.clientId });
        initializedClientId = configuration.clientId;
      }
      const identity = await GoogleSignIn.signIn({ nonce: configuration.nonce });
      const completionResponse = await fetch("/api/auth/google/native", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: identity.idToken }),
      });
      const completion = (await completionResponse.json()) as {
        ok?: boolean;
        next?: string;
        error?: string;
      };
      if (!completionResponse.ok || !completion.ok || !completion.next) {
        throw new Error(completion.error || "google_failed");
      }
      window.location.assign(completion.next);
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "google_failed";
      onError?.(GOOGLE_ERRORS[code] || GOOGLE_ERRORS.google_failed);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void start()}
      disabled={loading}
      className={cn(
        "flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-surface text-sm font-semibold ring-1 ring-inset ring-border transition-all hover:-translate-y-0.5 hover:bg-surface-2 hover:shadow-lg disabled:cursor-wait disabled:opacity-70",
        className,
      )}
    >
      <GoogleIcon /> {loading ? "Google openen…" : "Doorgaan met Google"}
    </button>
  );
}
