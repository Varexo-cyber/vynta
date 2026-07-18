"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Compass,
  MessagesSquare,
  ShieldCheck,
  Search,
  Tag,
  Warehouse,
  Handshake,
  Globe,
  Map,
  MapPin,
  Building2,
  Truck,
  Store,
  Cpu,
  Leaf,
  Utensils,
} from "lucide-react";
import { Logo } from "./app-shell";
import { Button } from "./ui/primitives";

const TICKER = [
  { icon: Search, text: "Verpakkingsbedrijf in Rotterdam zoekt 50.000 dozen", color: "var(--type-sourcing)" },
  { icon: Warehouse, text: "Logistiek bedrijf heeft capaciteit Amsterdam → Rotterdam", color: "var(--type-capacity)" },
  { icon: Tag, text: "Fabrikant verkoopt 8.000 aluminium beugels", color: "var(--type-selling)" },
  { icon: Handshake, text: "Retailer zoekt distributiepartners in Nederland", color: "var(--type-partnership)" },
  { icon: Search, text: "Restaurantketen zoekt 5.000L olijfolie / maand", color: "var(--type-sourcing)" },
];

const PILLARS = [
  { icon: Compass, title: "Ontdek kansen", body: "Een live feed van wat bedrijven nodig hebben en aanbieden — elke ochtend nieuwe deals." },
  { icon: MessagesSquare, title: "Doe zaken", body: "Snel, professioneel B2B-berichtenverkeer. Elk gesprek start met echte context." },
  { icon: ShieldCheck, title: "Bouw vertrouwen", body: "Geverifieerde bedrijven, beoordelingen en reactiesnelheden. Reputatie waarop je kunt bouwen." },
];

const NETWORKS = [
  { icon: Globe, label: "Heel Nederland" },
  { icon: Map, label: "Provincies" },
  { icon: MapPin, label: "Gemeenten" },
  { icon: Building2, label: "Bouw" },
  { icon: Truck, label: "Transport" },
  { icon: Store, label: "Retail" },
  { icon: Cpu, label: "Technologie" },
  { icon: Utensils, label: "Horeca & food" },
  { icon: Leaf, label: "Energie & duurzaamheid" },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="glass sticky top-0 z-40 border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <Logo height={34} />
            <span className="text-xl font-semibold tracking-tight">Vynta</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#pillars" className="hover:text-foreground">Product</a>
            <a href="#networks" className="hover:text-foreground">Netwerken</a>
            <a href="#trust" className="hover:text-foreground">Vertrouwen</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/auth"><Button variant="ghost" size="sm">Inloggen</Button></Link>
            <Link href="/auth"><Button size="sm">Word lid</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-8 pt-20 lg:pt-28">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-70"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, color-mix(in srgb, var(--brand) 18%, transparent), transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Het besturingssysteem voor zakelijk netwerken in Nederland
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
          >
            Wat heeft jouw bedrijf{" "}
            <span className="bg-gradient-to-r from-brand to-fuchsia-500 bg-clip-text text-transparent">
              vandaag nodig?
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mx-auto mt-5 max-w-xl text-lg text-muted"
          >
            Vynta is waar bedrijven wereldwijd kansen ontdekken, zaken doen en
            vertrouwen opbouwen. Geen berichten. Kansen.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-8 flex items-center justify-center gap-3"
          >
            <Link href="/onboarding">
              <Button size="lg">
                Word lid <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/feed">
              <Button variant="outline" size="lg">Bekijk de feed</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Demand ticker */}
      <section className="relative overflow-hidden py-8">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
        <div className="flex w-max animate-marquee gap-3">
          {[...TICKER, ...TICKER].map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 whitespace-nowrap rounded-2xl border border-border bg-surface px-4 py-3 text-sm"
            >
              <t.icon size={16} style={{ color: t.color }} />
              {t.text}
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section id="pillars" className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-3xl border border-border bg-surface p-7"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-brand/10 text-brand">
                <p.icon size={22} />
              </div>
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Netwerken */}
      <section id="networks" className="mx-auto max-w-4xl px-5 py-16 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">
          Vind je mensen. Doe zaken.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted">
          Automatisch verbonden via je gemeente, provincie, sector en het landelijke netwerk. Geen zoeken, wel relevante zakelijke contacten.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {NETWORKS.map((c) => (
            <span
              key={c.label}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium"
            >
              <c.icon size={16} strokeWidth={1.8} className="text-muted" />
              {c.label}
            </span>
          ))}
        </div>
      </section>

      {/* Trust CTA */}
      <section id="trust" className="mx-auto max-w-6xl px-5 py-16">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-surface p-10 text-center sm:p-16">
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-60"
            style={{
              background:
                "radial-gradient(50% 80% at 50% 100%, color-mix(in srgb, var(--brand) 16%, transparent), transparent)",
            }}
          />
          <ShieldCheck className="mx-auto mb-4 text-brand" size={36} />
          <h2 className="mx-auto max-w-xl text-3xl font-semibold tracking-tight">
            Zaken draaien op vertrouwen.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Verificatiebadges, beoordelingen en reactiesnelheden — zodat je altijd
            weet met wie je zaken doet.
          </p>
          <Link href="/onboarding" className="mt-8 inline-block">
            <Button size="lg">
              Maak je bedrijf aan <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted sm:flex-row">
          <div className="flex items-center gap-2">
            <Logo height={26} />
            <span className="font-medium text-foreground">Vynta</span>
            <span>— Het Zakelijke Netwerk</span>
          </div>
          <p>© {new Date().getFullYear()} Vynta. Ontworpen om onvermijdelijk te voelen.</p>
        </div>
      </footer>
    </div>
  );
}
