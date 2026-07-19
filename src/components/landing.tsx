import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Bookmark,
  Building2,
  Check,
  ChevronRight,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Network,
  Search,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";

const NETWORK_FEATURES = [
  {
    icon: Building2,
    title: "Een profiel dat vertrouwen uitstraalt",
    body: "Presenteer je organisatie, expertise en aanbod op één professionele bedrijfspagina.",
  },
  {
    icon: Network,
    title: "Een relevant zakelijk netwerk",
    body: "Volg bedrijven en ontdek kansen via je regio, sector en bestaande connecties.",
  },
  {
    icon: MessageSquare,
    title: "Van contact naar samenwerking",
    body: "Reageer op zakelijke vragen en zet het gesprek direct voort in beveiligde berichten.",
  },
];

const TRUST_POINTS = [
  "Bedrijfsprofielen als uitgangspunt",
  "Gerichte zakelijke vragen en aanbiedingen",
  "Direct contact zonder openbare privégegevens",
];

export function Landing() {
  return (
    <div className="min-h-screen bg-[#f5f6f7] text-[#17191c]">
      <header className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-5 sm:px-7">
          <Link href="/" className="flex items-center gap-3" aria-label="Vynta homepage">
            <BrandMark />
            <span className="text-[21px] font-bold tracking-[-0.04em]">Vynta</span>
          </Link>

          <nav className="hidden items-center gap-8 text-[14px] font-medium text-[#5d626a] md:flex" aria-label="Hoofdnavigatie">
            <a href="#platform" className="transition-colors hover:text-[#17191c]">Platform</a>
            <a href="#netwerk" className="transition-colors hover:text-[#17191c]">Voor bedrijven</a>
            <a href="#veiligheid" className="transition-colors hover:text-[#17191c]">Veiligheid</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/auth" className="rounded-lg px-3.5 py-2.5 text-[14px] font-semibold text-[#30343a] transition-colors hover:bg-[#f2f3f4]">
              Inloggen
            </Link>
            <Link href="/onboarding" className="rounded-lg bg-[#17191c] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#30343a]">
              <span className="sm:hidden">Aanmelden</span>
              <span className="hidden sm:inline">Bedrijf aanmelden</span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="overflow-hidden border-b border-[#e5e7eb] bg-white">
          <div className="mx-auto grid max-w-[1180px] grid-cols-[minmax(0,1fr)] items-center gap-12 px-5 py-14 sm:px-7 sm:py-20 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16 lg:py-24">
            <div className="min-w-0 max-w-[530px]">
              <div className="mb-6 flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.16em] text-[#68707b]">
                <span className="h-px w-7 bg-[#f15a37]" />
                Zakelijk netwerk voor Nederland
              </div>

              <h1 className="text-[43px] font-bold leading-[1.08] tracking-[-0.052em] text-[#121417] sm:text-[56px] lg:text-[62px]">
                Vind de juiste bedrijven. Bouw aan echte relaties.
              </h1>

              <p className="mt-6 max-w-[490px] text-[18px] leading-8 text-[#5d626a]">
                Vynta is het professionele netwerk waar Nederlandse bedrijven kennis delen,
                zakelijke kansen vinden en rechtstreeks met elkaar in contact komen.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/onboarding" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#f15a37] px-5 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(241,90,55,0.18)] transition-colors hover:bg-[#df4d2b]">
                  Maak een bedrijfsprofiel <ArrowRight size={17} strokeWidth={2.3} />
                </Link>
                <a href="#platform" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#d9dce1] bg-white px-5 text-[15px] font-semibold text-[#30343a] transition-colors hover:bg-[#f7f8f9]">
                  Bekijk het platform <ChevronRight size={17} />
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-medium text-[#68707b]">
                <span className="inline-flex items-center gap-2"><Check size={15} className="text-[#16835b]" /> Gratis aanmelden</span>
                <span className="inline-flex items-center gap-2"><Check size={15} className="text-[#16835b]" /> Voor Nederlandse bedrijven</span>
              </div>
            </div>

            <ProductPreview />
          </div>
        </section>

        <section className="border-b border-[#e1e4e8] bg-[#f5f6f7]">
          <div className="mx-auto grid max-w-[1180px] gap-6 px-5 py-7 text-[13px] font-semibold text-[#4e545d] sm:px-7 md:grid-cols-3">
            {TRUST_POINTS.map((point) => (
              <div key={point} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-[#16835b] ring-1 ring-[#dfe3e7]">
                  <Check size={14} strokeWidth={2.5} />
                </span>
                {point}
              </div>
            ))}
          </div>
        </section>

        <section id="platform" className="bg-white px-5 py-20 sm:px-7 sm:py-24">
          <div className="mx-auto max-w-[1180px]">
            <div className="grid gap-8 border-b border-[#e5e7eb] pb-12 md:grid-cols-[0.8fr_1.2fr] md:items-end">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#e25231]">Het platform</p>
                <h2 className="mt-3 text-[34px] font-bold leading-tight tracking-[-0.04em] sm:text-[42px]">
                  Zakelijk contact, zonder de ruis.
                </h2>
              </div>
              <p className="max-w-[620px] text-[17px] leading-7 text-[#626872] md:justify-self-end">
                Geen anonieme marktplaats en geen verzameling losse advertenties. Vynta verbindt iedere vraag,
                reactie en samenwerking aan een herkenbaar bedrijfsprofiel.
              </p>
            </div>

            <div id="netwerk" className="grid divide-y divide-[#e5e7eb] md:grid-cols-3 md:divide-x md:divide-y-0">
              {NETWORK_FEATURES.map((feature, index) => (
                <article key={feature.title} className="py-9 md:px-8 md:py-11 first:pl-0 last:pr-0">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#fff0eb] text-[#e25231]">
                      <feature.icon size={20} strokeWidth={1.9} />
                    </span>
                    <span className="text-[12px] font-semibold text-[#a0a5ad]">0{index + 1}</span>
                  </div>
                  <h3 className="mt-7 text-[19px] font-bold tracking-[-0.025em]">{feature.title}</h3>
                  <p className="mt-3 text-[15px] leading-6 text-[#69707a]">{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="veiligheid" className="px-5 py-16 sm:px-7 sm:py-20">
          <div className="mx-auto grid max-w-[1180px] overflow-hidden rounded-2xl border border-[#292d32] bg-[#17191c] text-white lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 sm:p-12 lg:p-14">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-[#ff7959]">
                <ShieldCheck size={23} />
              </div>
              <h2 className="mt-7 max-w-xl text-[32px] font-bold leading-tight tracking-[-0.04em] sm:text-[40px]">
                Professioneel netwerken begint met vertrouwen.
              </h2>
              <p className="mt-4 max-w-xl text-[16px] leading-7 text-[#b8bdc5]">
                Duidelijke bedrijfsinformatie, rapportagefuncties en actief platformbeheer helpen om contact
                relevant en professioneel te houden.
              </p>
            </div>
            <div className="border-t border-white/10 bg-[#202328] p-8 sm:p-12 lg:border-l lg:border-t-0 lg:p-14">
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#9299a3]">Klaar om te beginnen?</p>
              <p className="mt-4 text-[22px] font-semibold leading-8">Zet je bedrijf professioneel op de kaart binnen Vynta.</p>
              <Link href="/onboarding" className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-[14px] font-bold text-[#17191c] transition-colors hover:bg-[#eceef0]">
                Bedrijf aanmelden <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e1e4e8] bg-white">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex items-center gap-2.5">
            <BrandMark compact />
            <span className="font-bold tracking-[-0.03em]">Vynta</span>
            <span className="text-[13px] text-[#858b94]">Het zakelijke netwerk</span>
          </div>
          <p className="text-[13px] text-[#858b94]">© {new Date().getFullYear()} Vynta. Alle rechten voorbehouden.</p>
        </div>
      </footer>
    </div>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`relative grid shrink-0 place-items-center rounded-[9px] bg-[#111214] font-black tracking-[-0.08em] text-white ${compact ? "h-7 w-7 text-[16px]" : "h-9 w-9 text-[20px]"}`} aria-hidden="true">
      V
      <span className={`absolute rounded-full bg-[#f15a37] ${compact ? "bottom-1 right-1 h-1 w-1" : "bottom-1.5 right-1.5 h-1.5 w-1.5"}`} />
    </span>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto min-w-0 w-full max-w-[650px]" aria-label="Voorbeeld van de Vynta-bedrijfsfeed">
      <div className="absolute -inset-5 -z-10 rounded-[32px] bg-[#f0f2f4]" />
      <div className="overflow-hidden rounded-2xl border border-[#dfe2e6] bg-white shadow-[0_28px_70px_rgba(26,31,38,0.14)]">
        <div className="flex h-14 items-center gap-3 border-b border-[#e6e8eb] px-4">
          <BrandMark compact />
          <div className="hidden h-8 flex-1 items-center gap-2 rounded-lg bg-[#f3f4f5] px-3 text-[11px] text-[#8b9199] sm:flex">
            <Search size={13} /> Zoek bedrijven, diensten of kansen
          </div>
          <div className="ml-auto flex items-center gap-1 text-[#69707a]">
            <span className="grid h-8 w-8 place-items-center rounded-lg"><MessageCircle size={16} /></span>
            <span className="grid h-8 w-8 place-items-center rounded-lg"><Bell size={16} /></span>
            <span className="ml-1 grid h-7 w-7 place-items-center rounded-full bg-[#1f5b4e] text-[9px] font-bold text-white">VB</span>
          </div>
        </div>

        <div className="grid min-h-[475px] grid-cols-[62px_minmax(0,1fr)] sm:grid-cols-[148px_minmax(0,1fr)]">
          <aside className="border-r border-[#e8eaed] bg-[#fafafa] px-2 py-4 sm:px-3">
            <PreviewNav icon={Home} label="Feed" active />
            <PreviewNav icon={Users} label="Netwerk" />
            <PreviewNav icon={Target} label="Kansen" />
            <PreviewNav icon={MessageSquare} label="Berichten" />
            <div className="mx-1 mt-5 border-t border-[#e5e7ea] pt-5">
              <div className="hidden rounded-lg bg-[#17191c] px-3 py-2.5 text-center text-[10px] font-bold text-white sm:block">+ Plaats bericht</div>
            </div>
          </aside>

          <div className="bg-[#f6f7f8] p-3 sm:p-4">
            <div className="mb-3 rounded-xl border border-[#e2e4e8] bg-white p-3.5">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e6ecea] text-[9px] font-bold text-[#1f5b4e]">VB</span>
                <span className="flex h-9 flex-1 items-center rounded-lg border border-[#e2e4e8] px-3 text-[11px] text-[#858b94]">Deel een zakelijke vraag of update…</span>
              </div>
            </div>

            <article className="rounded-xl border border-[#dfe2e6] bg-white shadow-[0_1px_2px_rgba(20,24,29,0.03)]">
              <div className="flex items-start gap-3 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#184f47] text-[11px] font-bold text-white">NV</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-[12px] font-bold text-[#25282d]">Noordhaven Verpakkingen</p>
                    <BadgeCheck size={14} className="shrink-0 fill-[#e9f2ff] text-[#2b6cb0]" />
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#8b9199]"><MapPin size={10} /> Rotterdam · 18 min</p>
                </div>
                <MoreHorizontal size={17} className="text-[#91969d]" />
              </div>

              <div className="px-4 pb-4">
                <span className="inline-flex rounded-md bg-[#fff0eb] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#d84d2c]">Zakelijke vraag</span>
                <h3 className="mt-3 text-[14px] font-bold leading-5 text-[#24272b]">Gezocht: logistieke partner voor wekelijkse distributie</h3>
                <p className="mt-2 text-[11px] leading-[1.65] text-[#626872]">Voor uitbreiding in Zuid-Holland zoeken wij een vaste partner voor palletdistributie vanuit Rotterdam.</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-[#f1f3f4] px-2 py-1 text-[9px] font-medium text-[#646a73]">Logistiek</span>
                  <span className="rounded-md bg-[#f1f3f4] px-2 py-1 text-[9px] font-medium text-[#646a73]">Zuid-Holland</span>
                  <span className="rounded-md bg-[#f1f3f4] px-2 py-1 text-[9px] font-medium text-[#646a73]">Langdurig</span>
                </div>
              </div>

              <div className="flex items-center gap-5 border-t border-[#eceef0] px-4 py-3 text-[10px] font-semibold text-[#737983]">
                <span className="flex items-center gap-1.5"><Heart size={14} /> Interessant</span>
                <span className="flex items-center gap-1.5"><MessageCircle size={14} /> Reageren</span>
                <Bookmark size={14} className="ml-auto" />
              </div>
            </article>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#e2e4e8] bg-white p-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#9a9fa7]">Relevant netwerk</p>
                <div className="mt-3 flex -space-x-1.5">
                  {[["RT", "#315f76"], ["DL", "#76523c"], ["KV", "#5a4678"]].map(([name, color]) => (
                    <span key={name} className="grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[7px] font-bold text-white" style={{ backgroundColor: color }}>{name}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-[#e2e4e8] bg-white p-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#9a9fa7]">Nieuwe kans</p>
                <p className="mt-2 text-[11px] font-bold leading-4 text-[#373b41]">3 relevante matches</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-right text-[11px] text-[#9a9fa7]">Voorbeeldweergave van het platform</p>
    </div>
  );
}

function PreviewNav({ icon: Icon, label, active = false }: { icon: typeof Home; label: string; active?: boolean }) {
  return (
    <div className={`mb-1 flex h-9 items-center justify-center gap-2 rounded-lg px-2 text-[10px] font-semibold sm:justify-start ${active ? "bg-[#eceff1] text-[#202328]" : "text-[#7a8089]"}`}>
      <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}
