"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { signIn } from "@/lib/actions";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn(email, password);
    setLoading(false);
    if (res.ok) {
      router.push("/feed");
    } else {
      setError(res.error ?? "Inloggen mislukt");
    }
  };

  return (
    <div className="dark grid min-h-screen bg-background text-foreground lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-10 text-background lg:flex">
        <Link href="/" className="group relative inline-flex items-center gap-1.5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px]">
            <Image
              src="/logo.png"
              alt="Vynta"
              width={40}
              height={40}
              unoptimized
              className="h-full w-full scale-[1.6] object-cover"
            />
          </span>
          <span className="text-[17px] font-bold leading-none text-black">
            ynta
          </span>
        </Link>
        <div className="relative">
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Het digitale bedrijfsnetwerk van Nederland.
          </h1>
          <p className="mt-4 max-w-sm text-background/70">
            Vind, contacteer en doe zaken met lokale bedrijven in minuten.
          </p>
        </div>
        <p className="relative text-sm text-background/50">© {new Date().getFullYear()} Vynta</p>
      </div>

      {/* Form panel */}
      <div
        className="relative flex flex-col justify-center px-6 py-12 sm:px-16"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
          e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-300"
          style={{
            background:
              "radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(255,90,60,0.12), transparent 40%)",
          }}
        />
        <Link href="/" className="relative mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground lg:hidden">
          <ArrowLeft size={16} /> Terug
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-sm"
        >
          <h2 className="text-3xl font-semibold tracking-tight">Welkom terug</h2>
          <p className="mt-2 text-base text-muted">Log in bij je bedrijf.</p>

          <button className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-surface py-3 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-2">
            <GoogleIcon /> Doorgaan met Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" /> of <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3">
            <Field
              label="Zakelijk e-mailadres"
              type="email"
              placeholder="jij@bedrijf.nl"
              value={email}
              onChange={setEmail}
            />
            <Field
              label="Wachtwoord"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg" variant="accent">
              {loading ? "Bezig…" : "Inloggen"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Nieuw op Vynta?{" "}
            <Link href="/onboarding" className="font-medium text-foreground hover:underline">
              Account aanmaken
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-subtle">
            Demo: demo@vynta.app / vynta1234
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-2xl bg-surface px-4 py-3.5 text-[16px] outline-none transition-all duration-200 placeholder:text-muted focus:ring-1 focus:ring-inset focus:ring-border-strong"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.15 6.16-4.15Z" />
    </svg>
  );
}
