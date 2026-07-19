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

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.ok) {
      router.push("/feed");
      return;
    }
    setError(result.error ?? "Inloggen mislukt");
  };

  return (
    <div className="dark grid min-h-screen bg-background text-foreground lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-10 text-background lg:flex">
        <Link
          href="/"
          className="group relative inline-flex items-center gap-1.5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02]"
        >
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
          <span className="text-[17px] font-bold leading-none text-black">ynta</span>
        </Link>

        <div className="relative">
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Het digitale bedrijfsnetwerk van Nederland.
          </h1>
          <p className="mt-4 max-w-sm text-background/70">
            Vind, contacteer en doe zaken met lokale bedrijven in minuten.
          </p>
        </div>

        <p className="relative text-sm text-background/50">
          © {new Date().getFullYear()} Vynta
        </p>
      </div>

      <div
        className="relative flex flex-col justify-center px-6 py-12 sm:px-16"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty("--x", `${event.clientX - rect.left}px`);
          event.currentTarget.style.setProperty("--y", `${event.clientY - rect.top}px`);
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-300"
          style={{
            background:
              "radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(255,90,60,0.12), transparent 40%)",
          }}
        />
        <Link
          href="/"
          className="relative mb-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground lg:hidden"
        >
          <ArrowLeft size={16} /> Terug
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-sm"
        >
          <h2 className="text-3xl font-semibold tracking-tight">Welkom terug</h2>
          <p className="mt-2 text-base text-muted">Log in bij je bedrijf.</p>

          <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
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
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="mt-2 w-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              variant="accent"
            >
              {loading ? "Bezig…" : "Inloggen"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Nieuw op Vynta?{" "}
            <Link href="/onboarding" className="font-medium text-foreground hover:underline">
              Account aanmaken
            </Link>
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
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        autoComplete={type === "password" ? "current-password" : "email"}
        className="rounded-2xl bg-surface px-4 py-3.5 text-[16px] outline-none transition-all duration-200 placeholder:text-muted focus:ring-1 focus:ring-inset focus:ring-border-strong"
      />
    </label>
  );
}
