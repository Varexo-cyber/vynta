"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { VyntaBrand } from "@/components/vynta-brand";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/platform", label: "Platform" },
  { href: "/voor-bedrijven", label: "Voor bedrijven" },
  { href: "/veiligheid", label: "Veiligheid" },
];

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen overflow-x-clip bg-[#f5f6f7] text-[#17191c] selection:bg-[#ffddd4] selection:text-[#17191c]">
      <header className="sticky top-0 z-50 border-b border-[#e5e7eb]/90 bg-white/85 backdrop-blur-xl">
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
            <Link href="/auth" className="rounded-lg px-3 py-2.5 text-[14px] font-semibold text-[#30343a] transition-all hover:-translate-y-0.5 hover:bg-[#f2f3f4]">Inloggen</Link>
            <motion.div whileHover={{ y: -2, scale: 1.015 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 420, damping: 25 }}>
              <Link href="/onboarding" className="inline-flex items-center gap-1.5 rounded-lg bg-[#17191c] px-3.5 py-2.5 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(20,22,25,0.12)] transition-colors hover:bg-[#30343a] sm:px-4"><span className="sm:hidden">Aanmelden</span><span className="hidden sm:inline">Bedrijf aanmelden</span><ArrowUpRight size={15} /></Link>
            </motion.div>
          </div>
        </motion.div>
        <nav className="mx-auto flex max-w-[1180px] items-center justify-center gap-1 border-t border-[#eef0f2] px-3 py-1.5 md:hidden" aria-label="Mobiele hoofdnavigatie">
          {NAV.map((item) => <Link key={item.href} href={item.href} className={cn("rounded-lg px-3 py-2 text-[12px] font-semibold", pathname === item.href ? "bg-[#f1f3f4] text-[#17191c]" : "text-[#737a84]")}>{item.label}</Link>)}
        </nav>
      </header>

      <motion.main key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.main>

      <footer className="border-t border-[#e1e4e8] bg-white">
        <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-10 sm:px-7 md:grid-cols-[1fr_auto] md:items-end">
          <div><VyntaBrand size={30} /><p className="mt-4 max-w-sm text-[14px] leading-6 text-[#777e88]">Een professioneel netwerk voor bedrijven die elkaar verder willen helpen.</p></div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-[13px] font-semibold text-[#69707a]">{NAV.map((item) => <Link key={item.href} href={item.href} className="hover:text-[#17191c]">{item.label}</Link>)}<Link href="/auth" className="hover:text-[#17191c]">Inloggen</Link></div>
          <p className="text-[12px] text-[#979da5] md:col-span-2">© {new Date().getFullYear()} Vynta. Alle rechten voorbehouden.</p>
        </div>
      </footer>
    </div>
  );
}

export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return <motion.div initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.62, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>{children}</motion.div>;
}
