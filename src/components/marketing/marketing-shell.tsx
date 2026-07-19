"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { VyntaBrand } from "@/components/vynta-brand";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/platform", label: "Platform" },
  { href: "/voor-bedrijven", label: "Voor bedrijven" },
  { href: "/veiligheid", label: "Veiligheid" },
];

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 180, damping: 32, mass: 0.35 });

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f5f6f7] text-[#17191c] selection:bg-[#ffddd4] selection:text-[#17191c]">
      <header className="sticky top-0 z-50 border-b border-[#e5e7eb]/90 bg-white/85 backdrop-blur-xl">
        <motion.div className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-[#f15a37]" style={{ scaleX: progress }} aria-hidden="true" />
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-5 sm:px-7">
          <VyntaBrand size={38} />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Hoofdnavigatie">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={cn("relative rounded-lg px-4 py-2 text-[14px] font-semibold transition-colors", active ? "text-[#17191c]" : "text-[#666d77] hover:bg-[#f3f4f5] hover:text-[#17191c]")}>
                  {item.label}
                  {active && <motion.span layoutId="marketing-nav-active" className="absolute inset-x-4 -bottom-[15px] h-0.5 rounded-full bg-[#f15a37]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <span className="hidden items-center gap-1.5 rounded-full border border-[#e3e6e9] bg-[#f8f9fa] px-3 py-1.5 text-[11px] font-bold text-[#59616b] lg:inline-flex"><Check size={13} className="text-[#16835b]" /> Gratis starten</span>
            <Link href="/auth" className="rounded-lg px-3 py-2.5 text-[14px] font-semibold text-[#30343a] transition-all hover:-translate-y-0.5 hover:bg-[#f2f3f4]">Inloggen</Link>
            <motion.div whileHover={{ y: -2, scale: 1.015 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 420, damping: 25 }}>
              <Link href="/onboarding" className="inline-flex items-center gap-1.5 rounded-lg bg-[#17191c] px-3.5 py-2.5 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(20,22,25,0.12)] transition-colors hover:bg-[#30343a] sm:px-4"><span className="sm:hidden">Gratis starten</span><span className="hidden sm:inline">Bedrijf aanmelden</span><ArrowUpRight size={15} /></Link>
            </motion.div>
          </div>
        </motion.div>
        <nav className="mx-auto flex max-w-[1180px] items-center justify-center gap-1 border-t border-[#eef0f2] px-3 py-1.5 md:hidden" aria-label="Mobiele hoofdnavigatie">
          {NAV.map((item) => <Link key={item.href} href={item.href} className={cn("rounded-lg px-3 py-2 text-[12px] font-semibold", pathname === item.href ? "bg-[#f1f3f4] text-[#17191c]" : "text-[#737a84]")}>{item.label}</Link>)}
        </nav>
      </header>

      <motion.main key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.main>

      <footer className="relative overflow-hidden border-t border-[#2a2e33] bg-[#17191c] text-white">
        <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-[#f15a37]/15 blur-[100px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="relative mx-auto max-w-[1180px] px-5 py-12 sm:px-7 sm:py-16">
          <div className="grid gap-8 border-b border-white/10 pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff8b6f]">Gratis zakelijk socialmediaplatform</p>
              <h2 className="mt-4 max-w-3xl text-[32px] font-bold leading-[1.08] tracking-[-0.045em] sm:text-[46px]">Bouw je zakelijke netwerk voordat je het nodig hebt.</h2>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#aeb4bd]">Maak kosteloos een bedrijfsprofiel, ontdek relevante bedrijven en zet een zakelijke vraag om in direct contact.</p>
            </div>
            <motion.div whileHover={{ y: -3, scale: 1.015 }} whileTap={{ scale: 0.98 }}>
              <Link href="/onboarding" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#f15a37] px-5 text-[14px] font-bold text-white shadow-[0_16px_35px_rgba(241,90,55,.2)] transition-colors hover:bg-[#ff6c49]">Gratis bedrijfsprofiel <ArrowRight size={16} /></Link>
            </motion.div>
          </div>
          <div className="grid gap-8 pt-9 md:grid-cols-[1fr_auto] md:items-end">
            <div><VyntaBrand size={30} textClassName="text-white" /><p className="mt-4 max-w-md text-[13px] leading-6 text-[#8f97a2]">Het Nederlandse socialmediaplatform voor professioneel contact tussen bedrijven.</p></div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-[13px] font-semibold text-[#aeb4bd]">{NAV.map((item) => <Link key={item.href} href={item.href} className="transition-colors hover:text-white">{item.label}</Link>)}<Link href="/auth" className="transition-colors hover:text-white">Inloggen</Link></div>
            <p className="text-[12px] text-[#747c87] md:col-span-2">© {new Date().getFullYear()} Vynta. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.62, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>{children}</motion.div>;
}
