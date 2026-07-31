"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
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
    <div className="marketing-shell min-h-screen overflow-x-clip bg-[#f1eee7] text-[#121210] selection:bg-[#ffb29f] selection:text-[#121210]">
      <header className="sticky top-0 z-50 border-b border-[#c9c1b5] bg-[#f8f5ef]">
        <motion.div className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-[#f15a37]" style={{ scaleX: progress }} aria-hidden="true" />
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <VyntaBrand size={38} markSrc="/logo.png" />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Hoofdnavigatie">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={cn("relative px-4 py-2 text-[13px] font-bold transition-colors", active ? "text-[#121210]" : "text-[#6d675e] hover:text-[#121210]")}>
                  {item.label}
                  {active && <motion.span layoutId="marketing-nav-active" className="absolute inset-x-4 -bottom-[15px] h-0.5 bg-[#f04d23]" />}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <Link href="/auth" className="inline-flex min-h-11 items-center rounded-md px-3 py-2.5 text-[14px] font-bold text-[#302d28] hover:bg-white">Inloggen</Link>
            <Link href="/onboarding" className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-[#121210] px-3.5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-[#f04d23] sm:px-4">Bedrijf aanmelden <ArrowUpRight size={15} /></Link>
          </div>
        </motion.div>
        <nav className="mx-auto flex max-w-full items-center justify-start gap-1 overflow-x-auto border-t border-[#d8d1c7] px-3 py-1.5 md:hidden" aria-label="Mobiele hoofdnavigatie">
          {NAV.map((item) => <Link key={item.href} href={item.href} className={cn("inline-flex min-h-11 shrink-0 items-center rounded-sm px-3 py-2 text-[12px] font-bold", pathname === item.href ? "bg-[#121210] text-white" : "text-[#6d675e]")}>{item.label}</Link>)}
        </nav>
      </header>

      <motion.main key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.main>

      <footer className="border-t border-[#2a2925] bg-[#11110f] text-white">
        <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
          <div className="grid gap-8 border-b border-white/10 pb-12 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff7657]">Zakelijk netwerk voor bedrijven</p>
              <h2 className="mt-4 max-w-3xl text-[32px] font-bold leading-[1.08] tracking-[-0.045em] sm:text-[46px]">Bouw je zakelijke netwerk voordat je het nodig hebt.</h2>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#aeb4bd]">Maak een herkenbaar bedrijfsprofiel, ontdek relevante bedrijven en zet een zakelijke vraag om in direct contact.</p>
            </div>
            <Link href="/onboarding" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#f04d23] px-5 text-[14px] font-bold text-white transition-colors hover:bg-[#d9401b]">Bedrijf aanmelden <ArrowRight size={16} /></Link>
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
