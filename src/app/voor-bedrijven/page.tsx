import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Factory, Handshake, MapPin, PackageSearch, Store } from "lucide-react";
import { MarketingShell, Reveal } from "@/components/marketing/marketing-shell";

export const metadata = {
  title: "Voor bedrijven | Vynta",
  description: "Vynta helpt Nederlandse bedrijven om leveranciers, klanten en samenwerkingspartners te vinden.",
};

const MOMENTS = [
  { icon: PackageSearch, title: "Je hebt iets nodig", body: "Een leverancier, specialist of product dat je niet via je vaste contacten vindt. Plaats een heldere vraag en bereik bedrijven buiten je huidige kring." },
  { icon: Store, title: "Je hebt iets te bieden", body: "Laat zien waar je goed in bent zonder koude acquisitie te sturen. Reageer wanneer je aanbod echt aansluit op een concrete behoefte." },
  { icon: Handshake, title: "Je wilt samen verder", body: "Vind distributiepartners, lokale samenwerkingen of bedrijven die een ontbrekend deel van je plan kunnen invullen." },
];

export default function ForCompaniesPage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden bg-[#17191c] text-white">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="absolute -right-24 top-16 h-96 w-96 rounded-full bg-[#f15a37]/20 blur-[110px]" />
        <div className="relative mx-auto max-w-[1180px] px-5 py-24 sm:px-7 sm:py-32">
          <Reveal className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8c70]">Voor bedrijven</p>
            <h1 className="mt-5 text-[47px] font-bold leading-[1.06] tracking-[-0.055em] sm:text-[68px]">Je volgende zakelijke contact zit vaak dichterbij dan je denkt.</h1>
            <p className="mt-7 max-w-2xl text-[18px] leading-8 text-[#c0c5cc]">Vynta maakt zichtbaar welke bedrijven in Nederland iets zoeken, aanbieden of willen opbouwen. Jij bepaalt wanneer een contact relevant genoeg is om te reageren.</p>
            <Link href="/onboarding" className="mt-9 inline-flex h-12 items-center gap-2 rounded-lg bg-[#f15a37] px-5 text-sm font-bold text-white transition-all hover:-translate-y-1 hover:bg-[#ff6a46] hover:shadow-[0_15px_35px_rgba(241,90,55,.25)]">Zet je bedrijf op Vynta <ArrowRight size={17} /></Link>
          </Reveal>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-7 sm:py-28">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="grid gap-7 border-b border-[#e3e6e9] pb-12 md:grid-cols-2 md:items-end">
            <h2 className="text-[38px] font-bold leading-tight tracking-[-0.045em] sm:text-[50px]">Voor de momenten waarop je netwerk nog niet groot genoeg is.</h2>
            <p className="text-[17px] leading-8 text-[#676e78]">Niet iedere zakelijke vraag verdient een advertentiecampagne of twintig koude mails. Soms wil je gewoon weten: wie kan dit leveren, wie heeft ervaring, wie wil meedenken?</p>
          </Reveal>
          <div className="grid md:grid-cols-3">
            {MOMENTS.map((moment, index) => (
              <Reveal key={moment.title} delay={index * 0.08} className="border-b border-[#e3e6e9] py-10 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff0eb] text-[#e25231]"><moment.icon size={21} /></span>
                <h3 className="mt-7 text-xl font-bold">{moment.title}</h3>
                <p className="mt-3 text-[15px] leading-7 text-[#69707a]">{moment.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f6f7] px-5 py-20 sm:px-7 sm:py-24">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e25231]">Nederlands en relevant</p>
            <h2 className="mt-4 text-[38px] font-bold leading-tight tracking-[-0.045em]">Lokaal als het kan. Landelijk als het nodig is.</h2>
            <p className="mt-5 text-[16px] leading-7 text-[#69707a]">Je regio en sector geven richting, maar zetten geen hek om je netwerk. Een leverancier om de hoek en een producent aan de andere kant van het land kunnen allebei relevant zijn.</p>
          </Reveal>
          <Reveal delay={0.1} className="grid gap-3 sm:grid-cols-2">
            {[
              [MapPin, "Regio", "Vind bedrijven in je gemeente en provincie."],
              [Factory, "Sector", "Volg ontwikkelingen binnen jouw vakgebied."],
              [BriefcaseBusiness, "Zakelijke behoefte", "Zoek op wat er nu daadwerkelijk nodig is."],
              [Handshake, "Relatie", "Bouw verder na het eerste contactmoment."],
            ].map(([Icon, title, body]) => {
              const ItemIcon = Icon as typeof MapPin;
              return <div key={String(title)} className="rounded-xl border border-[#e0e3e7] bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-xl"><ItemIcon size={20} className="text-[#e25231]" /><h3 className="mt-5 font-bold">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-[#737a84]">{String(body)}</p></div>;
            })}
          </Reveal>
        </div>
      </section>
    </MarketingShell>
  );
}
