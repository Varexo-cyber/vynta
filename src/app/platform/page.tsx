import Link from "next/link";
import { ArrowRight, Bell, Building2, Check, Globe2, MessageSquare, Search, Target, Users, Zap } from "lucide-react";
import { MarketingShell, Reveal } from "@/components/marketing/marketing-shell";

const FEATURES = [
  { icon: Search, number: "01", title: "Een feed met een zakelijk doel", body: "Je ziet vragen, aanbod en updates van bedrijven die bij jouw regio en netwerk passen. Geen eindeloze stroom willekeurige content." },
  { icon: Building2, number: "02", title: "Het bedrijf staat centraal", body: "Achter ieder bericht zit een bedrijfsprofiel. Zo weet je met wie je praat en kun je eerst rustig bekijken of een organisatie bij je past." },
  { icon: MessageSquare, number: "03", title: "Reageren wordt een gesprek", body: "Een interessante vraag gevonden? Reageer openbaar of ga verder in een direct bericht, met de oorspronkelijke context bij de hand." },
  { icon: Target, number: "04", title: "Kansen blijven overzichtelijk", body: "Bewaar relevante posts, volg bedrijven en houd gesprekken bij zonder losse notities of zoekgeraakte contactmomenten." },
];

export const metadata = {
  title: "Platform | Vynta",
  description: "Bekijk hoe het gratis zakelijke socialmediaplatform Vynta bedrijfsprofielen, zakelijke vragen en directe gesprekken samenbrengt.",
};

export default function PlatformPage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden border-b border-[#e4e7ea] bg-white">
        <div className="absolute left-[56%] top-20 h-72 w-72 rounded-full bg-[#ffede8] blur-[90px]" />
        <div className="relative mx-auto grid max-w-[1180px] gap-12 px-5 py-20 sm:px-7 sm:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e25231]">Gratis zakelijk socialmediaplatform</p>
            <h1 className="mt-5 max-w-2xl text-[46px] font-bold leading-[1.06] tracking-[-0.055em] sm:text-[64px]">
              Van zakelijke vraag naar een echt gesprek.
            </h1>
            <p className="mt-6 max-w-xl text-[18px] leading-8 text-[#626872]">
              Vynta brengt gratis samen wat je normaal over verschillende kanalen verspreidt: bedrijven ontdekken, hun context beoordelen, inhoudelijk reageren en contact houden.
            </p>
            <Link href="/onboarding" className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-[#17191c] px-5 text-sm font-bold text-white transition-all hover:-translate-y-1 hover:shadow-xl">
              Gratis starten met je bedrijf <ArrowRight size={17} />
            </Link>
          </Reveal>

          <Reveal delay={0.12} className="relative">
            <div className="rounded-2xl border border-[#dce0e4] bg-[#f7f8f9] p-4 shadow-[0_30px_80px_rgba(27,31,36,0.12)] sm:p-6">
              <div className="flex items-center justify-between border-b border-[#dfe3e7] pb-4">
                <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#9399a2]">Vandaag in je netwerk</p><p className="mt-1 font-bold">Van signaal naar samenwerking</p></div>
                <span className="relative grid h-10 w-10 place-items-center rounded-full bg-white text-[#e25231] shadow-sm"><Bell size={18} /><span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#f15a37] ring-2 ring-white" /></span>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["Nieuwe zakelijke vraag", "Transportpartner gezocht in Utrecht", "Nu"],
                  ["Relevant bedrijf", "Van Leeuwen Logistiek past bij deze vraag", "2 min"],
                  ["Nieuw gesprek", "Je reactie is beantwoord", "18 min"],
                ].map(([label, text, time], index) => (
                  <div key={label} className="group flex items-center gap-4 rounded-xl border border-[#e1e4e8] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#f3a18d] hover:shadow-lg">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#fff0eb] text-sm font-black text-[#e25231]">{index + 1}</span>
                    <div className="min-w-0 flex-1"><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#9399a2]">{label}</p><p className="mt-1 truncate text-sm font-semibold">{text}</p></div>
                    <span className="text-[11px] text-[#9aa0a8]">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#f5f6f7] px-5 py-20 sm:px-7 sm:py-28">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e25231]">Zo werkt het</p>
            <h2 className="mt-4 text-[36px] font-bold leading-tight tracking-[-0.045em] sm:text-[48px]">Rust in je netwerk. Tempo in je contact.</h2>
          </Reveal>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[#dfe3e7] bg-[#dfe3e7] md:grid-cols-2">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 0.06} className="bg-white p-7 sm:p-10">
                <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff0eb] text-[#e25231]"><feature.icon size={21} /></span><span className="text-xs font-bold text-[#b0b5bc]">{feature.number}</span></div>
                <h3 className="mt-8 text-xl font-bold tracking-[-0.03em]">{feature.title}</h3>
                <p className="mt-3 max-w-lg text-[15px] leading-7 text-[#6b727c]">{feature.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#17191c] px-5 py-20 text-white sm:px-7 sm:py-24">
        <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-[#f15a37]/20 blur-[100px]" />
        <div className="relative mx-auto max-w-[1180px]">
          <Reveal className="grid gap-7 border-b border-white/10 pb-10 md:grid-cols-[1fr_0.7fr] md:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8b6f]">Direct bruikbaar</p><h2 className="mt-4 max-w-3xl text-[36px] font-bold leading-tight tracking-[-0.045em] sm:text-[48px]">Een compleet professioneel vertrekpunt. Zonder abonnement.</h2></div>
            <p className="text-[15px] leading-7 text-[#aeb4bd]">Je hoeft geen betaalmuur voorbij om zichtbaar te worden, relevante bedrijven te ontdekken of een zakelijk gesprek te beginnen.</p>
          </Reveal>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 mt-10 md:grid-cols-3">
            {[
              [Building2, "Gratis bedrijfsprofiel", "Leg helder vast wie je bent, wat je doet en met wie je wilt verbinden."],
              [Globe2, "Nederland ontdekken", "Vind bedrijven via zakelijke behoeften, regio, sector en netwerk."],
              [Zap, "Direct contact", "Reageer op het juiste moment en houd de context bij het gesprek."],
            ].map(([Icon, title, body], index) => {
              const ItemIcon = Icon as typeof Building2;
              return <Reveal key={String(title)} delay={index * 0.07} className="group bg-[#1d2024] p-7 transition-colors hover:bg-[#23272c] sm:p-9"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-[#ff8b6f]"><ItemIcon size={20} /></span><Check size={17} className="text-[#39b889]" /></div><h3 className="mt-7 text-xl font-bold">{String(title)}</h3><p className="mt-3 text-[14px] leading-6 text-[#9fa6b0]">{String(body)}</p></Reveal>;
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-7">
        <Reveal className="mx-auto flex max-w-[1180px] flex-col gap-8 rounded-2xl bg-[#17191c] p-8 text-white sm:p-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10 text-[#ff7959]"><Users size={22} /></span><div><h2 className="text-2xl font-bold">Bekijk Vynta vanuit je eigen bedrijf.</h2><p className="mt-2 text-[#b9bec6]">Een goed netwerk begint met een duidelijk, gratis profiel.</p></div></div>
          <Link href="/onboarding" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-bold text-[#17191c]">Gratis aanmelden <ArrowRight size={16} /></Link>
        </Reveal>
      </section>
    </MarketingShell>
  );
}
