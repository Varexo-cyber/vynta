"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, BadgeCheck, Bell, Bookmark, Building2, ChevronRight, Heart, Home,
  MapPin, MessageCircle, MessageSquare, MoreHorizontal, Network, Search,
  ShieldCheck, Target, Users,
} from "lucide-react";
import { MarketingShell, Reveal } from "@/components/marketing/marketing-shell";
import { VyntaMark } from "@/components/vynta-brand";

const WORKFLOW = [
  { icon: Search, number: "01", title: "Zeg wat je nodig hebt", body: "Plaats een concrete vraag, capaciteit of zakelijke kans. Geen campagne, maar context waar bedrijven direct op kunnen handelen." },
  { icon: Building2, number: "02", title: "Vind het bedrijf erachter", body: "Iedere reactie is gekoppeld aan een herkenbaar bedrijfsprofiel met sector, regio, mensen en eerder werk." },
  { icon: MessageSquare, number: "03", title: "Praat verder zonder contextverlies", body: "Van eerste reactie naar privégesprek, met de oorspronkelijke vraag altijd zichtbaar in het gesprek." },
];

export function Landing() {
  return (
    <MarketingShell>
      <section className="border-b border-[#cbc3b6] bg-[#f1eee7]">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:px-12 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="min-w-0">
            <p className="vynta-kicker">Het bedrijvennetwerk van Nederland</p>
            <h1 className="mt-7 max-w-[720px] text-[47px] font-bold leading-[0.96] tracking-[-0.065em] text-[#121210] sm:text-[68px] lg:text-[76px]">
              Vind het bedrijf dat je verder brengt.
            </h1>
            <p className="mt-7 max-w-[590px] text-[18px] leading-8 text-[#575249] sm:text-[20px]">
              Plaats wat je zoekt, laat zien wat je kunt en kom rechtstreeks in gesprek met Nederlandse bedrijven die passen bij de volgende stap.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/onboarding" className="inline-flex min-h-13 items-center justify-center gap-3 rounded-md bg-[#121210] px-6 py-3 text-[15px] font-bold text-white transition-colors hover:bg-[#f04d23]">Bedrijf aanmelden <ArrowRight size={17} /></Link>
              <Link href="/platform" className="inline-flex min-h-13 items-center justify-center gap-3 rounded-md border border-[#aaa194] bg-transparent px-6 py-3 text-[15px] font-bold text-[#292620] transition-colors hover:bg-white">Zo werkt Vynta <ChevronRight size={17} /></Link>
            </div>
            <div className="mt-10 grid grid-cols-3 border-y border-[#cbc3b6] py-4 text-[10px] font-bold uppercase tracking-[0.13em] text-[#716b61]">
              <span>Nederland</span><span>Bedrijf tot bedrijf</span><span>Direct contact</span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.08 }} className="min-w-0">
            <ProductPreview />
          </motion.div>
        </div>
      </section>

      <section className="bg-[#f04d23] px-5 py-6 text-white sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em]">Nu actief op Vynta</p>
          <div className="flex flex-wrap gap-x-7 gap-y-2 text-sm font-semibold">
            <span>Transportpartner gezocht in Rotterdam</span><span className="hidden opacity-50 sm:inline">/</span><span>Productiecapaciteit vrij in Brabant</span>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="grid gap-8 border-b border-[#d8d1c7] pb-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <p className="vynta-kicker">Van behoefte naar gesprek</p>
            <h2 className="text-[39px] font-bold leading-[1.02] tracking-[-0.055em] text-[#121210] sm:text-[58px]">Geen bereik om het bereik. Wel bedrijven die iets voor elkaar kunnen betekenen.</h2>
          </Reveal>
          <div className="divide-y divide-[#d8d1c7]">
            {WORKFLOW.map((step, index) => (
              <Reveal key={step.number} delay={index * 0.05} className="grid gap-5 py-9 sm:grid-cols-[90px_1fr_1fr] sm:items-start sm:py-12">
                <span className="text-[12px] font-bold tracking-[0.14em] text-[#f04d23]">{step.number}</span>
                <div className="flex items-start gap-4"><step.icon size={24} strokeWidth={1.7} className="mt-1 shrink-0" /><h3 className="text-[25px] font-bold leading-tight">{step.title}</h3></div>
                <p className="max-w-xl text-[16px] leading-7 text-[#625d55]">{step.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#11110f] px-5 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="grid gap-8 border-b border-white/15 pb-12 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <div><p className="vynta-kicker">Gebouwd voor zakendoen</p><h2 className="mt-6 max-w-3xl text-[41px] font-bold leading-[1.02] tracking-[-0.055em] sm:text-[60px]">Een netwerk met geheugen.</h2></div>
            <p className="text-[17px] leading-8 text-white/60">Profiel, vraag, reactie en gesprek blijven aan elkaar gekoppeld. Zo weet je ook weken later nog waarom een contact relevant was.</p>
          </Reveal>
          <div className="grid divide-y divide-white/15 md:grid-cols-3 md:divide-x md:divide-y-0">
            {[[Network, "Gericht ontdekken", "Filter op regio, sector en actuele zakelijke behoefte."], [ShieldCheck, "Herkenbare bedrijven", "Contact begint bij een bedrijfsprofiel, niet bij een anoniem account."], [MessageSquare, "Context in het gesprek", "De oorspronkelijke kans blijft zichtbaar wanneer je verder praat."]].map(([Icon, title, body]) => {
              const ItemIcon = Icon as typeof Network;
              return <div key={String(title)} className="py-9 md:px-8 md:py-12 md:first:pl-0 md:last:pr-0"><ItemIcon size={23} className="text-[#ff6542]" /><h3 className="mt-8 text-xl font-bold">{String(title)}</h3><p className="mt-3 text-[15px] leading-7 text-white/55">{String(body)}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f1eee7] px-5 py-20 sm:px-8 sm:py-24">
        <Reveal className="mx-auto grid max-w-[1180px] gap-8 border-y border-[#bbb2a5] py-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div><p className="vynta-kicker">Jouw bedrijf hoort ertussen</p><h2 className="mt-5 max-w-3xl text-[36px] font-bold leading-tight tracking-[-0.05em] sm:text-[50px]">Laat zien wat je doet. Vind wat je nodig hebt.</h2></div>
          <Link href="/onboarding" className="inline-flex min-h-13 items-center justify-center gap-3 rounded-md bg-[#f04d23] px-6 py-3 text-sm font-bold text-white hover:bg-[#d9401b]">Bedrijf aanmelden <ArrowRight size={17} /></Link>
        </Reveal>
      </section>
    </MarketingShell>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full min-w-0 max-w-[650px]" aria-label="Voorbeeld van de Vynta-bedrijfsfeed">
      <div className="overflow-hidden rounded-lg border border-[#ada69a] bg-white shadow-[12px_12px_0_#d9d3c9]">
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
      <div className="mt-4 flex items-center justify-between border-t border-[#bbb2a5] pt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#716b61]"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#f04d23]" /> Actuele bedrijfsvraag</span><span>Platformvoorbeeld</span></div>
    </div>
  );
}

function PreviewNav({ icon: Icon, label, active = false }: { icon: typeof Home; label: string; active?: boolean }) {
  return <div className={`mb-1 flex h-9 items-center justify-center gap-2 rounded-sm px-2 text-[10px] font-semibold sm:justify-start ${active ? "bg-[#121210] text-white" : "text-[#7a8089]"}`}><Icon size={15} strokeWidth={active ? 2.2 : 1.8} /><span className="hidden sm:inline">{label}</span></div>;
}
