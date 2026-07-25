"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { VyntaBrand } from "@/components/vynta-brand";
import { signIn } from "@/lib/actions";

const GOOGLE_ERRORS: Record<string, string> = {
  google_unavailable: "Inloggen met Google is nog niet geconfigureerd. Gebruik voorlopig je e-mailadres en wachtwoord.",
  google_cancelled: "De Google-inlog is geannuleerd.",
  google_invalid_state: "Deze Google-inlog is verlopen. Probeer het opnieuw.",
  google_no_identity: "Google heeft geen geldige identiteit teruggestuurd. Probeer het opnieuw.",
  google_unverified: "Dit Google-account heeft geen geverifieerd e-mailadres.",
  google_account_conflict: "Dit e-mailadres is al aan een ander Google-account gekoppeld.",
  account_inactive: "Dit account is geschorst of gedeactiveerd. Neem contact op met Vynta.",
  google_failed: "Google-inloggen is niet voltooid. Probeer het opnieuw.",
};

class SignInTimeoutError extends Error {}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 25_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new SignInTimeoutError()), timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export default function AuthPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#090909]" />}><AuthContent /></Suspense>;
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleErrorCode = searchParams.get("error");
  const visibleError = error ?? (googleErrorCode ? GOOGLE_ERRORS[googleErrorCode] ?? "Inloggen is niet voltooid. Probeer het opnieuw." : null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await withTimeout(signIn(email, password));
      if (result.ok) {
        router.replace("/feed");
        router.refresh();
        return;
      }
      setError(result.error ?? "Inloggen mislukt");
    } catch (cause) {
      setError(
        cause instanceof SignInTimeoutError
          ? "Het inloggen duurt te lang. Controleer je verbinding en probeer het opnieuw."
          : "Inloggen is technisch niet voltooid. Probeer het opnieuw."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="native-auth grid min-h-screen bg-background text-foreground lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-10 text-background lg:flex">
        <VyntaBrand size={40} markSrc="/logoaa.png" textClassName="text-black" />
        <div className="relative">
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">Het digitale bedrijfsnetwerk van Nederland.</h1>
          <p className="mt-4 max-w-sm text-background/70">Vind, contacteer en doe zaken met lokale bedrijven in minuten.</p>
        </div>
        <p className="relative text-sm text-background/50">© {new Date().getFullYear()} Vynta</p>
      </div>

      <div
        className="native-auth__panel relative flex min-h-screen flex-col justify-center px-6 py-12 sm:px-16"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty("--x", `${event.clientX - rect.left}px`);
          event.currentTarget.style.setProperty("--y", `${event.clientY - rect.top}px`);
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-300" style={{ background: "radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(255,90,60,0.12), transparent 40%)" }} />
        <div className="native-auth__mobile-brand">
          <VyntaBrand size={38} textClassName="text-foreground" />
          <span className="native-auth__secure"><LockKeyhole size={13} /> Beveiligd</span>
        </div>
        <Link href="/" className="native-auth__back relative mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground lg:hidden"><ArrowLeft size={16} /> Terug</Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="native-auth__content relative mx-auto w-full max-w-sm">
          <p className="native-auth__eyebrow"><Check size={13} /> Zakelijk netwerk voor Nederland</p>
          <h1 className="text-3xl font-semibold tracking-tight">Welkom terug</h1>
          <p className="mt-2 text-base text-muted">Ga verder met je bedrijf op Vynta.</p>

          <GoogleAuthButton className="mt-8" onError={(message) => setError(message || null)} />
          <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-border" />of<span className="h-px flex-1 bg-border" /></div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            <Field label="Zakelijk e-mailadres" type="email" placeholder="jij@bedrijf.nl" value={email} onChange={setEmail} />
            <Field label="Wachtwoord" type="password" placeholder="••••••••••" value={password} onChange={setPassword} />
            {visibleError && <p className="rounded-xl bg-red-500/10 px-3 py-2.5 text-sm text-red-400" role="alert">{visibleError}</p>}
            <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg" variant="accent">{loading ? "Bezig…" : "Inloggen"}</Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">Nieuw op Vynta? <Link href="/onboarding" className="font-medium text-foreground hover:underline">Account aanmaken</Link></p>
          <p className="native-auth__legal">Door verder te gaan ga je akkoord met onze voorwaarden en privacyregels.</p>
        </motion.div>
      </div>
    </div>
  );
}

function Field({ label, type, placeholder, value, onChange }: { label: string; type: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required autoComplete={type === "password" ? "current-password" : "email"} className="rounded-2xl bg-surface px-4 py-3.5 text-[16px] outline-none transition-all duration-200 placeholder:text-muted focus:ring-1 focus:ring-inset focus:ring-border-strong" />
    </label>
  );
}
