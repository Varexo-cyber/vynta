"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity, ArrowRight, BadgeCheck, Bell, Bookmark, Building2, Check, ChevronRight,
  Globe2, Heart, Home, Layers3, MapPin, MessageCircle, MessageSquare, MoreHorizontal,
  Network, Search, Send, ShieldCheck, Sparkles, Target, TrendingUp, Users, Zap,
} from "lucide-react";
import { MarketingShell, Reveal } from "@/components/marketing/marketing-shell";
import { VyntaMark } from "@/components/vynta-brand";

const NETWORK_FEATURES = [
  { icon: Building2, title: "Een profiel dat vertrouwen uitstraalt", body: "Presenteer je organisatie, expertise en aanbod op één professionele bedrijfspagina." },
  { icon: Network, title: "Een relevant zakelijk netwerk", body: "Volg bedrijven en ontdek kansen via je regio, sector en bestaande connecties." },
  { icon: MessageSquare, title: "Van contact naar samenwerking", body: "Reageer op zakelijke vragen en zet het gesprek direct voort in beveiligde berichten." },
];

const TRUST_POINTS = [
  "Gratis bedrijfsprofiel",
  "Zakelijke social media zonder ruis",
  "Direct contact vanuit ieder relevant bericht",
];

const PLATFORM_MOMENTS = [
  { icon: Search, label: "Ontdekken", title: "Zie wat bedrijven nu nodig hebben", body: "Vind actuele vragen, aanbod en updates op regio, sector en relevantie." },
  { icon: Building2, label: "Profileren", title: "Laat je bedrijf herkenbaar spreken", body: "Publiceer vanuit één professioneel profiel in plaats van een los persoonlijk account." },
  { icon: MessageSquare, label: "Reageren", title: "Ga van bericht naar gesprek", body: "Reageer inhoudelijk en verplaats het contact daarna veilig naar privéberichten." },
  { icon: Network, label: "Groeien", title: "Bouw relaties die blijven bestaan", body: "Volg bedrijven, bewaar kansen en houd je zakelijke netwerk bij elkaar." },
];

const PLATFORM_PROMISES = [
  { value: "€0", label: "om te starten", detail: "Geen abonnement nodig voor je bedrijfsprofiel." },
  { value: "B2B", label: "van begin tot eind", detail: "Bedrijven, zakelijke context en relevante gesprekken." },
  { value: "NL", label: "landelijk netwerk", detail: "Lokaal ontdekken en door heel Nederland verbinden." },
];

const LIVE_EVENTS = [
  { icon: Target, label: "Nieuwe match", value: "3 bedrijven passen bij deze vraag", color: "#f15a37" },
  { icon: MessageCircle, label: "Reactie ontvangen", value: "Noordhaven reageerde zojuist", color: "#16745f" },
  { icon: Network, label: "Netwerk groeit", value: "Logistiek Zuid-Holland · +12", color: "#315f76" },
];

export function Landing() {
  const reduceMotion = useReducedMotion();
  const [intro, setIntro] = useState(false);

  useEffect(() => {
    if (reduceMotion || sessionStorage.getItem("vynta-intro-seen")) return;
    sessionStorage.setItem("vynta-intro-seen", "1");
    const showTimer = window.setTimeout(() => setIntro(true), 0);
    const hideTimer = window.setTimeout(() => setIntro(false), 720);
    return () => { window.clearTimeout(showTimer); window.clearTimeout(hideTimer); };
  }, [reduceMotion]);

  return (
    <MarketingShell>
      <AnimatePresence>
        {intro && (
          <motion.div className="fixed inset-0 z-[100] grid place-items-center bg-[#17191c]" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.28 } }} aria-hidden="true">
            <motion.div initial={{ opacity: 0, scale: 0.78, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 360, damping: 25 }} className="flex items-center gap-2">
              <VyntaMark size={54} />
              <span className="text-2xl font-bold tracking-[-0.04em] text-white">ynta</span>
            </motion.div>
            <motion.span className="absolute bottom-0 left-0 h-0.5 bg-[#f15a37]" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }} />
          </motion.div>
        )}
      </AnimatePresence>

      <section
        className="group/hero relative overflow-hidden border-b border-[#e5e7eb] bg-white"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty("--hero-x", `${event.clientX - rect.left}px`);
          event.currentTarget.style.setProperty("--hero-y", `${event.clientY - rect.top}px`);
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-80 [background:radial-gradient(580px_circle_at_var(--hero-x,72%)_var(--hero-y,34%),rgba(241,90,55,0.09),transparent_62%)] transition-opacity duration-500" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(#17191c_1px,transparent_1px),linear-gradient(90deg,#17191c_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />

        <div className="relative mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-12 px-5 py-14 sm:px-7 sm:py-20 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16 lg:py-24">
          <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }} className="min-w-0 max-w-[540px]">
            <div className="mb-6 flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.16em] text-[#68707b]">
              <motion.span className="h-px bg-[#f15a37]" initial={{ width: 0 }} animate={{ width: 28 }} transition={{ delay: 0.2, duration: 0.5 }} />
              Gratis socialmediaplatform voor Nederlandse bedrijven
            </div>
            <h1 className="text-[43px] font-bold leading-[1.06] tracking-[-0.052em] text-[#121417] sm:text-[56px] lg:text-[62px]">Vind de juiste bedrijven. Bouw aan echte relaties.</h1>
            <p className="mt-6 max-w-[510px] text-[18px] leading-8 text-[#5d626a]">Vynta is het gratis zakelijke socialmediaplatform waar Nederlandse bedrijven zich presenteren, kennis delen, kansen vinden en rechtstreeks met elkaar in contact komen.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <motion.div whileHover={{ y: -3, scale: 1.015 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 24 }}>
                <Link href="/onboarding" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#f15a37] px-5 text-[15px] font-bold text-white shadow-[0_10px_28px_rgba(241,90,55,0.22)] transition-colors hover:bg-[#df4d2b]">Gratis bedrijfsprofiel <ArrowRight size={17} strokeWidth={2.3} /></Link>
              </motion.div>
              <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 24 }}>
                <Link href="/platform" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#d9dce1] bg-white px-5 text-[15px] font-semibold text-[#30343a] transition-colors hover:border-[#b9bec5] hover:bg-[#f7f8f9]">Bekijk het platform <ChevronRight size={17} /></Link>
              </motion.div>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-medium text-[#68707b]">
              <span className="inline-flex items-center gap-2"><Check size={15} className="text-[#16835b]" /> Gratis starten, geen abonnement</span>
              <span className="inline-flex items-center gap-2"><Check size={15} className="text-[#16835b]" /> Voor Nederlandse bedrijven</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 28, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>
            <ProductPreview />
          </motion.div>
        </div>
      </section>

      <section className="border-b border-[#e1e4e8] bg-[#f5f6f7]">
        <div className="mx-auto grid max-w-[1180px] gap-6 px-5 py-7 text-[13px] font-semibold text-[#4e545d] sm:px-7 md:grid-cols-3">
          {TRUST_POINTS.map((point, index) => (
            <Reveal key={point} delay={index * 0.06} className="flex items-center gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-[#16835b] ring-1 ring-[#dfe3e7]"><Check size={14} strokeWidth={2.5} /></span>{point}
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#17191c] px-5 py-20 text-white sm:px-7 sm:py-24">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-[#f15a37]/20 blur-[130px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="relative mx-auto max-w-[1180px]">
          <Reveal className="grid gap-8 border-b border-white/10 pb-11 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff8b6f]">Eén platform. Een compleet zakelijk netwerk.</p>
              <h2 className="mt-4 max-w-3xl text-[36px] font-bold leading-[1.08] tracking-[-0.045em] sm:text-[52px]">Professioneel zichtbaar zijn, zonder eerst advertentiebudget vrij te maken.</h2>
            </div>
            <p className="text-[16px] leading-7 text-[#aeb4bd] lg:pb-1">Vynta is gratis om te starten. Je bedrijf krijgt een vaste plek, je team kan relevante signalen volgen en ieder goed contact begint met duidelijke zakelijke context.</p>
          </Reveal>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 mt-10 md:grid-cols-3">
            {PLATFORM_PROMISES.map((promise, index) => (
              <Reveal key={promise.value} delay={index * 0.07} className="group relative bg-[#1d2024] p-7 transition-colors hover:bg-[#22262b] sm:p-8">
                <span className="absolute right-6 top-6 h-2 w-2 rounded-full bg-[#f15a37] shadow-[0_0_18px_rgba(241,90,55,.8)]" />
                <p className="text-[42px] font-bold tracking-[-0.06em] text-white">{promise.value}</p>
                <p className="mt-1 text-[13px] font-bold uppercase tracking-[0.12em] text-[#ff8b6f]">{promise.label}</p>
                <p className="mt-5 max-w-xs text-[14px] leading-6 text-[#9fa6b0]">{promise.detail}</p>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4 rounded-xl border border-white/10 bg-white/[0.035] px-5 py-4 text-[12px] font-semibold text-[#c8cdd4]">
            <span className="inline-flex items-center gap-2 text-[#ff8b6f]"><Activity size={16} /> Live op Vynta</span>
            {["Nieuwe vraag uit Rotterdam", "Samenwerking gezocht in Utrecht", "Producent gevonden in Brabant"].map((signal, index) => (
              <motion.span key={signal} className="inline-flex items-center gap-2" animate={reduceMotion ? undefined : { opacity: [0.45, 1, 0.45] }} transition={{ duration: 2.6, repeat: Infinity, delay: index * 0.55 }}><span className="h-1.5 w-1.5 rounded-full bg-[#38b889]" />{signal}</motion.span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-7 sm:py-28">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="grid gap-8 border-b border-[#e5e7eb] pb-12 md:grid-cols-[0.8fr_1.2fr] md:items-end">
            <div><p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#e25231]">Het platform</p><h2 className="mt-3 text-[34px] font-bold leading-tight tracking-[-0.04em] sm:text-[44px]">Zakelijk contact, zonder de ruis.</h2></div>
            <p className="max-w-[620px] text-[17px] leading-7 text-[#626872] md:justify-self-end">Geen anonieme marktplaats en geen verzameling losse advertenties. Vynta verbindt iedere vraag, reactie en samenwerking aan een herkenbaar bedrijfsprofiel.</p>
          </Reveal>
          <div className="grid divide-y divide-[#e5e7eb] md:grid-cols-3 md:divide-x md:divide-y-0">
            {NETWORK_FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 0.08} className="group py-9 md:px-8 md:py-11 first:pl-0 last:pr-0">
                <div className="flex items-center justify-between"><motion.span whileHover={{ rotate: -6, scale: 1.08 }} className="grid h-10 w-10 place-items-center rounded-lg bg-[#fff0eb] text-[#e25231]"><feature.icon size={20} strokeWidth={1.9} /></motion.span><span className="text-[12px] font-semibold text-[#a0a5ad]">0{index + 1}</span></div>
                <h3 className="mt-7 text-[19px] font-bold tracking-[-0.025em]">{feature.title}</h3><p className="mt-3 text-[15px] leading-6 text-[#69707a]">{feature.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-[#e1e4e8] bg-[#f4f5f6] px-5 py-20 sm:px-7 sm:py-28">
        <div className="pointer-events-none absolute left-1/2 top-10 h-80 w-80 rounded-full bg-[#ffddd4]/55 blur-[120px]" />
        <div className="relative mx-auto max-w-[1180px]">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e25231]">Van zichtbaarheid naar samenwerking</p>
            <h2 className="mt-4 text-[36px] font-bold leading-[1.08] tracking-[-0.045em] sm:text-[52px]">Alles wat een zakelijk socialmediaplatform nuttig moet maken.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-7 text-[#676e78]">Niet meer bereik om het bereik. Wel een duidelijke route van bedrijfsprofiel naar relevante ontdekking, inhoudelijke reactie en duurzaam contact.</p>
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {PLATFORM_MOMENTS.map((moment, index) => (
              <Reveal key={moment.title} delay={index * 0.06} className="group relative overflow-hidden rounded-2xl border border-[#dfe3e7] bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#f0a18e] hover:shadow-[0_24px_65px_rgba(24,28,33,.1)] sm:p-9">
                <div className="absolute right-0 top-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full bg-[#fff0eb] transition-transform duration-500 group-hover:scale-125" />
                <div className="relative flex items-start justify-between gap-5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#17191c] text-white shadow-[0_10px_24px_rgba(23,25,28,.13)]"><moment.icon size={21} /></span>
                  <span className="text-[12px] font-bold text-[#afb4bc]">0{index + 1}</span>
                </div>
                <div className="relative mt-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#e25231]">{moment.label}</p>
                  <h3 className="mt-3 text-[22px] font-bold tracking-[-0.035em]">{moment.title}</h3>
                  <p className="mt-3 max-w-lg text-[15px] leading-7 text-[#6a717b]">{moment.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-[#dfe3e7] bg-[#dfe3e7] sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Globe2, "Heel Nederland", "Regio en sector geven richting."],
              [Layers3, "Eén context", "Profiel, bericht en gesprek bij elkaar."],
              [TrendingUp, "Blijvende waarde", "Bewaar kansen en volg relaties."],
              [Send, "Direct verder", "Van relevante reactie naar privécontact."],
            ].map(([Icon, title, body]) => {
              const SignalIcon = Icon as typeof Globe2;
              return <div key={String(title)} className="bg-white p-6"><SignalIcon size={19} className="text-[#e25231]" /><p className="mt-4 text-[14px] font-bold">{String(title)}</p><p className="mt-2 text-[13px] leading-5 text-[#757c86]">{String(body)}</p></div>;
            })}
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f5f6f7] px-5 py-20 sm:px-7 sm:py-24">
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-[#f15a37]/10 blur-[90px]" />
        <Reveal className="relative mx-auto grid max-w-[1180px] overflow-hidden rounded-2xl border border-[#292d32] bg-[#17191c] text-white lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-8 sm:p-12 lg:p-14"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-[#ff7959]"><ShieldCheck size={23} /></div><h2 className="mt-7 max-w-xl text-[32px] font-bold leading-tight tracking-[-0.04em] sm:text-[40px]">Professioneel netwerken begint met vertrouwen.</h2><p className="mt-4 max-w-xl text-[16px] leading-7 text-[#b8bdc5]">Duidelijke bedrijfsinformatie, rapportagefuncties en actief platformbeheer helpen om contact relevant en professioneel te houden.</p></div>
          <div className="border-t border-white/10 bg-[#202328] p-8 sm:p-12 lg:border-l lg:border-t-0 lg:p-14"><p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#9299a3]">Klaar om te beginnen?</p><p className="mt-4 text-[22px] font-semibold leading-8">Zet je bedrijf professioneel én gratis op de kaart binnen Vynta.</p><p className="mt-3 text-[13px] leading-6 text-[#9299a3]">Geen abonnement nodig om je profiel te maken.</p><Link href="/onboarding" className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-[14px] font-bold text-[#17191c] transition-all hover:-translate-y-1 hover:bg-[#eceef0]">Gratis aanmelden <ArrowRight size={16} /></Link></div>
        </Reveal>
      </section>
    </MarketingShell>
  );
}

function ProductPreview() {
  const [eventIndex, setEventIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setEventIndex((index) => (index + 1) % LIVE_EVENTS.length), 3200);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);
  const liveEvent = LIVE_EVENTS[eventIndex];
  const LiveIcon = liveEvent.icon;

  return (
    <div className="relative mx-auto w-full min-w-0 max-w-[650px]" aria-label="Voorbeeld van de Vynta-bedrijfsfeed">
      <motion.div className="absolute -inset-5 -z-10 rounded-[32px] bg-[#f0f2f4]" animate={reduceMotion ? undefined : { y: [0, -5, 0], rotate: [0, 0.25, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
      <div className="overflow-hidden rounded-2xl border border-[#dfe2e6] bg-white shadow-[0_28px_70px_rgba(26,31,38,0.14)]">
        <div className="flex h-14 items-center gap-3 border-b border-[#e6e8eb] px-4">
          <VyntaMark size={28} />
          <div className="hidden h-8 flex-1 items-center gap-2 rounded-lg bg-[#f3f4f5] px-3 text-[11px] text-[#8b9199] sm:flex"><Search size={13} /> Zoek bedrijven, diensten of kansen</div>
          <div className="ml-auto flex items-center gap-1 text-[#69707a]"><span className="grid h-8 w-8 place-items-center rounded-lg"><MessageCircle size={16} /></span><span className="relative grid h-8 w-8 place-items-center rounded-lg"><Bell size={16} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#f15a37]" /></span><span className="ml-1 grid h-7 w-7 place-items-center rounded-full bg-[#1f5b4e] text-[9px] font-bold text-white">VB</span></div>
        </div>
        <div className="grid min-h-[475px] grid-cols-[62px_minmax(0,1fr)] sm:grid-cols-[148px_minmax(0,1fr)]">
          <aside className="border-r border-[#e8eaed] bg-[#fafafa] px-2 py-4 sm:px-3"><PreviewNav icon={Home} label="Feed" active /><PreviewNav icon={Users} label="Netwerk" /><PreviewNav icon={Target} label="Kansen" /><PreviewNav icon={MessageSquare} label="Berichten" /><div className="mx-1 mt-5 border-t border-[#e5e7ea] pt-5"><div className="hidden rounded-lg bg-[#17191c] px-3 py-2.5 text-center text-[10px] font-bold text-white sm:block">+ Plaats bericht</div></div></aside>
          <div className="bg-[#f6f7f8] p-3 sm:p-4">
            <div className="mb-3 rounded-xl border border-[#e2e4e8] bg-white p-3.5"><div className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e6ecea] text-[9px] font-bold text-[#1f5b4e]">VB</span><span className="flex h-9 flex-1 items-center rounded-lg border border-[#e2e4e8] px-3 text-[11px] text-[#858b94]">Deel een zakelijke vraag of update…</span></div></div>
            <article className="rounded-xl border border-[#dfe2e6] bg-white shadow-[0_1px_2px_rgba(20,24,29,0.03)]">
              <div className="flex items-start gap-3 p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#184f47] text-[11px] font-bold text-white">NV</span><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><p className="truncate text-[12px] font-bold text-[#25282d]">Noordhaven Verpakkingen</p><BadgeCheck size={14} className="shrink-0 fill-[#e9f2ff] text-[#2b6cb0]" /></div><p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#8b9199]"><MapPin size={10} /> Rotterdam · 18 min</p></div><MoreHorizontal size={17} className="text-[#91969d]" /></div>
              <div className="px-4 pb-4"><span className="inline-flex rounded-md bg-[#fff0eb] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#d84d2c]">Zakelijke vraag</span><h3 className="mt-3 text-[14px] font-bold leading-5 text-[#24272b]">Gezocht: logistieke partner voor wekelijkse distributie</h3><p className="mt-2 text-[11px] leading-[1.65] text-[#626872]">Voor uitbreiding in Zuid-Holland zoeken wij een vaste partner voor palletdistributie vanuit Rotterdam.</p><div className="mt-3 flex flex-wrap gap-1.5">{["Logistiek", "Zuid-Holland", "Langdurig"].map((tag) => <span key={tag} className="rounded-md bg-[#f1f3f4] px-2 py-1 text-[9px] font-medium text-[#646a73]">{tag}</span>)}</div></div>
              <div className="flex items-center gap-5 border-t border-[#eceef0] px-4 py-3 text-[10px] font-semibold text-[#737983]"><span className="flex items-center gap-1.5"><Heart size={14} /> Interessant</span><span className="flex items-center gap-1.5"><MessageCircle size={14} /> Reageren</span><Bookmark size={14} className="ml-auto" /></div>
            </article>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#e2e4e8] bg-white p-3"><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#9a9fa7]">Relevant netwerk</p><div className="mt-3 flex -space-x-1.5">{[["RT", "#315f76"], ["DL", "#76523c"], ["KV", "#5a4678"]].map(([name, color]) => <span key={name} className="grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[7px] font-bold text-white" style={{ backgroundColor: color }}>{name}</span>)}</div></div>
              <div className="rounded-xl border border-[#e2e4e8] bg-white p-3"><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#9a9fa7]">Nieuwe kans</p><p className="mt-2 text-[11px] font-bold leading-4 text-[#373b41]">3 relevante matches</p></div>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence mode="wait"><motion.div key={eventIndex} initial={{ opacity: 0, x: 18, y: 6, scale: 0.96 }} animate={{ opacity: 1, x: 0, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ type: "spring", stiffness: 330, damping: 25 }} className="absolute -right-2 top-[30%] hidden w-[230px] items-center gap-3 rounded-xl border border-[#e0e3e7] bg-white/95 p-3 shadow-[0_18px_50px_rgba(28,32,38,.17)] backdrop-blur sm:flex lg:-right-10"><span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f4f5f6]" style={{ color: liveEvent.color }}><LiveIcon size={17} /><span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#f15a37] ring-2 ring-white" /></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#949aa2]">{liveEvent.label}</p><p className="mt-1 truncate text-[11px] font-semibold text-[#33373c]">{liveEvent.value}</p></div></motion.div></AnimatePresence>
      <motion.div className="absolute -bottom-4 -left-3 hidden items-center gap-2 rounded-xl border border-[#e0e3e7] bg-white px-3 py-2 text-[11px] font-bold text-[#363a40] shadow-xl sm:flex lg:-left-8" animate={reduceMotion ? undefined : { y: [0, -5, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#fff0eb] text-[#e25231]"><Zap size={14} /></span>Live zakelijk netwerk <Sparkles size={13} className="text-[#e25231]" /></motion.div>
      <p className="mt-4 text-right text-[11px] text-[#9a9fa7]">Voorbeeldweergave van het platform</p>
    </div>
  );
}

function PreviewNav({ icon: Icon, label, active = false }: { icon: typeof Home; label: string; active?: boolean }) {
  return <div className={`mb-1 flex h-9 items-center justify-center gap-2 rounded-lg px-2 text-[10px] font-semibold sm:justify-start ${active ? "bg-[#eceff1] text-[#202328]" : "text-[#7a8089]"}`}><Icon size={15} strokeWidth={active ? 2.2 : 1.8} /><span className="hidden sm:inline">{label}</span></div>;
}
