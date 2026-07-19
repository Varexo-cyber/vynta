import Link from "next/link";
import { ArrowRight, BadgeCheck, Check, Eye, FileSearch, Flag, Gavel, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import { MarketingShell, Reveal } from "@/components/marketing/marketing-shell";

export const metadata = {
  title: "Veiligheid | Vynta",
  description: "Lees hoe Vynta bedrijfsidentiteit, accountbeveiliging, rapportages en moderatie behandelt.",
};

const PRINCIPLES = [
  { icon: Building2Icon, title: "Een bedrijf is niet anoniem", body: "Profielen zijn opgebouwd rond bedrijfsinformatie. Een badge kan aanvullende controle aangeven, maar vervangt nooit je eigen zakelijke due diligence." },
  { icon: LockKeyhole, title: "Sessies blijven server-side", body: "Inlogsessies gebruiken beveiligde, httpOnly cookies. Wachtwoorden worden gehasht en Google-tokens worden niet in de browser of het bedrijfsprofiel opgeslagen." },
  { icon: Flag, title: "Melden zit in het platform", body: "Posts en gesprekken kunnen worden gerapporteerd. De platformbeheerder ziet meldingen in een afzonderlijke omgeving en kan passende actie nemen." },
  { icon: Eye, title: "Beheer is herleidbaar", body: "Moderatiehandelingen worden vastgelegd in een auditlog. Accounts kunnen worden geschorst of gedeactiveerd wanneer gedrag daar aanleiding toe geeft." },
];

function Building2Icon(props: React.ComponentProps<typeof ShieldCheck>) {
  return <BadgeCheck {...props} />;
}

export default function SafetyPage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden border-b border-[#e3e6e9] bg-white">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f15a37] via-[#ff997f] to-[#17191c]" />
        <div className="mx-auto grid max-w-[1180px] gap-12 px-5 py-20 sm:px-7 sm:py-28 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e25231]">Veiligheid en vertrouwen</p>
            <h1 className="mt-5 text-[47px] font-bold leading-[1.06] tracking-[-0.055em] sm:text-[66px]">Vertrouwen ontstaat niet door een mooi vinkje.</h1>
            <p className="mt-6 max-w-2xl text-[18px] leading-8 text-[#626872]">Het ontstaat wanneer duidelijk is met wie je praat, je ongewenst gedrag kunt melden en platformbeheer zichtbaar verantwoordelijkheid neemt. Gratis toegang verandert niets aan die standaard.</p>
          </Reveal>
          <Reveal delay={0.12} className="rounded-2xl border border-[#dfe3e7] bg-[#f6f7f8] p-6 sm:p-8">
            <div className="flex items-center gap-4 border-b border-[#dfe3e7] pb-6"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#17191c] text-white"><ShieldCheck size={24} /></span><div><p className="font-bold">Veiligheid is een proces</p><p className="mt-1 text-sm text-[#737a84]">Controleren, melden, beoordelen en handelen.</p></div></div>
            <div className="mt-6 space-y-4">
              {["Beveiligde accounttoegang", "Rapportages voor posts en gesprekken", "Owner- en moderatieomgeving", "Auditlog van beheeracties"].map((item) => <div key={item} className="flex items-center gap-3 text-sm font-semibold"><BadgeCheck size={17} className="text-[#16835b]" />{item}</div>)}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-[#f5f6f7] px-5 py-20 sm:px-7 sm:py-28">
        <div className="mx-auto max-w-[1180px]">
          <Reveal className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e25231]">Onze uitgangspunten</p><h2 className="mt-4 text-[37px] font-bold leading-tight tracking-[-0.045em] sm:text-[48px]">Praktische bescherming, zonder loze garanties.</h2></Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {PRINCIPLES.map((principle, index) => (
              <Reveal key={principle.title} delay={index * 0.06} className="rounded-2xl border border-[#dfe3e7] bg-white p-7 sm:p-9">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff0eb] text-[#e25231]"><principle.icon size={21} /></span>
                <h3 className="mt-7 text-xl font-bold">{principle.title}</h3>
                <p className="mt-3 text-[15px] leading-7 text-[#69707a]">{principle.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#17191c] px-5 py-20 text-white sm:px-7 sm:py-24">
        <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-[#f15a37]/20 blur-[110px]" />
        <div className="relative mx-auto max-w-[1180px]">
          <Reveal className="grid gap-7 border-b border-white/10 pb-10 md:grid-cols-[1fr_0.75fr] md:items-end">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8b6f]">Van signaal naar actie</p><h2 className="mt-4 text-[37px] font-bold leading-tight tracking-[-0.045em] sm:text-[49px]">Melden is pas nuttig wanneer er iets mee gebeurt.</h2></div>
            <p className="text-[15px] leading-7 text-[#aeb4bd]">Daarom houdt Vynta rapportage, beoordeling en beheer gescheiden van de gewone gebruikerservaring.</p>
          </Reveal>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
            {[
              [Flag, "01", "Melden", "Een gebruiker rapporteert een post of gesprek met relevante context."],
              [FileSearch, "02", "Beoordelen", "De melding komt terecht in de afzonderlijke beheeromgeving."],
              [Gavel, "03", "Handelen", "De beheerder kan content verwijderen of een account beperken wanneer dat nodig is."],
            ].map(([Icon, number, title, body], index) => {
              const StepIcon = Icon as typeof Flag;
              return <Reveal key={String(title)} delay={index * 0.07} className="bg-[#1d2024] p-7 sm:p-9"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-[#ff8b6f]"><StepIcon size={20} /></span><span className="text-xs font-bold text-[#6f7782]">{String(number)}</span></div><h3 className="mt-7 text-xl font-bold">{String(title)}</h3><p className="mt-3 text-[14px] leading-6 text-[#9fa6b0]">{String(body)}</p><div className="mt-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#39b889]"><Check size={14} /> Herleidbaar proces</div></Reveal>;
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-7">
        <Reveal className="mx-auto grid max-w-[1180px] gap-8 rounded-2xl border border-[#e0e3e7] p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#17191c] text-white"><Scale size={21} /></span><div><h2 className="text-2xl font-bold">Blijf ook zelf zakelijk controleren.</h2><p className="mt-2 max-w-2xl text-[15px] leading-7 text-[#69707a]">Controleer afspraken, bevoegdheid, KVK-gegevens en betaalvoorwaarden voordat je een overeenkomst sluit. Vynta helpt bij het contact; jij houdt de regie over de deal.</p></div></div>
          <Link href="/platform" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#17191c] px-5 text-sm font-bold text-white">Bekijk het platform <ArrowRight size={16} /></Link>
        </Reveal>
      </section>
    </MarketingShell>
  );
}
