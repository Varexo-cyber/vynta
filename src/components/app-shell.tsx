"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  Search,
  Users,
  MessageSquare,
  Bell,
  Plus,
  Sun,
  Moon,
  X,
  Settings,
  Bookmark,
  Target,
  ShieldCheck,
  CircleHelp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";
import { useApp } from "./app-store";
import { CompanyAvatar } from "./ui/primitives";
import { CreatePostModal } from "./create-post-modal";
import { ThemedLogo } from "./themed-logo";
import { VyntaAssistant } from "./help/vynta-assistant";
import { ProductTour } from "./help/product-tour";
import { VyntaBrand, VyntaMark } from "./vynta-brand";

const NAV = [
  { href: "/feed", label: "Feed", icon: Home, tourId: "feed" },
  { href: "/search", label: "Zoeken", icon: Search, tourId: "search" },
  { href: "/networks", label: "Netwerken", icon: Users, tourId: "networks" },
  { href: "/opportunities", label: "Kansen", icon: Target, tourId: "opportunities" },
  { href: "/messages", label: "Berichten", icon: MessageSquare, tourId: "messages" },
];

const MOBILE_NAV = [
  NAV[0],
  NAV[1],
  NAV[3],
  NAV[4],
];

function mobileTitle(pathname: string) {
  if (pathname.startsWith("/search")) return "Ontdekken";
  if (pathname.startsWith("/opportunities")) return "Kansen";
  if (pathname.startsWith("/messages")) return "Berichten";
  if (pathname.startsWith("/notifications")) return "Meldingen";
  if (pathname.startsWith("/networks")) return "Netwerken";
  if (pathname.startsWith("/settings")) return "Instellingen";
  if (pathname.startsWith("/company")) return "Bedrijfsprofiel";
  if (pathname.startsWith("/owner")) return "Owner Center";
  return "Vandaag";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { resolved, toggle } = useTheme();
  const { me, platformRole, setCreateOpen, setCreateType, createType, unreadMessages, unreadNotifications, unreadOpportunities, toasts, dismissToast } = useApp();
  const canManagePlatform = platformRole === "admin" || platformRole === "owner";
  const isActive = (href: string) =>
    href === "/feed" ? pathname === "/feed" || pathname === "/" : pathname.startsWith(href);

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-clip bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[248px] flex-col border-r border-white/10 bg-sidebar text-white lg:flex">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6">
          <Link href="/feed" className="mb-8 block border-b border-white/10 px-2 pb-6" aria-label="Vynta feed">
            <VyntaBrand size={42} textClassName="text-white" />
            <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Bedrijvennetwerk · Nederland</p>
          </Link>

          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = isActive(item.href);
              const badge = item.href === "/messages" ? unreadMessages : item.href === "/opportunities" ? unreadOpportunities : 0;
              return (
                <div key={item.href} data-tour-id={item.tourId}>
                  <NavRow item={item} active={active} badge={badge} />
                </div>
              );
            })}
            <NavRow
              item={{ href: "/notifications", label: "Meldingen", icon: Bell, tourId: "notifications" }}
              active={isActive("/notifications")}
              badge={unreadNotifications}
            />
          </nav>

          <button
            onClick={() => { setCreateType(null); setCreateOpen(true); }}
            data-tour-id="create-post"
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#ff633d] press"
          >
            <Plus size={18} strokeWidth={2.5} />
            Plaats bericht
          </button>

          <div className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-4">
            {canManagePlatform && (
              <Link
                href="/owner"
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname.startsWith("/owner") ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white"
                )}
              >
                <ShieldCheck size={20} />
                Owner Center
              </Link>
            )}
            <Link
              href="/saved"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith("/saved") ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white"
              )}
            >
              <Bookmark size={20} />
              Opgeslagen
            </Link>
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith("/settings") ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white"
              )}
            >
              <Settings size={20} />
              Instellingen
            </Link>
            <button
              onClick={toggle}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/55 transition-colors hover:bg-white/5 hover:text-white"
            >
              {resolved === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              {resolved === "dark" ? "Licht thema" : "Donker thema"}
            </button>
          </div>
        </div>

        <Link
          href={`/company/${me.id}`}
          data-tour-id="company-profile"
          className="flex items-center gap-3 border-t border-white/10 p-5 transition-colors hover:bg-white/5"
        >
          <CompanyAvatar name={me.name} color={me.logoColor} logoUrl={me.logoUrl} website={me.website} size={42} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{me.name}</p>
            <p className="truncate text-xs text-white/45">Mijn bedrijf</p>
          </div>
        </Link>
      </aside>

      {/* Mobile header */}
      <header className="mobile-app-header fixed inset-x-0 top-0 z-40 flex h-14 max-w-full items-center justify-between border-b border-border bg-surface px-3 lg:hidden">
        <Link href="/feed" className="flex min-w-0 items-center gap-2.5" aria-label="Naar je feed">
          <VyntaMark size={31} src={resolved === "dark" ? "/logoaa.png" : "/logo.png"} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold leading-none">{mobileTitle(pathname)}</p>
            <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-subtle">Vynta</p>
          </div>
        </Link>
        <div className="flex shrink-0 items-center gap-0.5">
          <Link
            href="/help"
            className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            aria-label="Hulp"
          >
            <CircleHelp size={20} />
          </Link>
          {canManagePlatform && (
            <Link
              href="/owner"
              className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              aria-label="Owner Center"
            >
              <ShieldCheck size={20} />
            </Link>
          )}
          <Link
            href="/notifications"
            className="relative grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            aria-label="Meldingen"
          >
            <Bell size={20} />
            {unreadNotifications > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-fg">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </Link>
          <Link
            href={`/company/${me.id}`}
            data-tour-id="company-profile"
            className="rounded-full p-0.5"
            aria-label="Mijn bedrijfsprofiel"
          >
            <CompanyAvatar name={me.name} color={me.logoColor} logoUrl={me.logoUrl} website={me.website} size={32} />
          </Link>
        </div>
      </header>

      <main className="app-main min-h-screen pt-14 pb-20 lg:pb-0 lg:pl-[248px]">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-tab-bar fixed inset-x-0 bottom-0 z-40 grid max-w-full grid-cols-5 items-center border-t border-border bg-surface px-1 lg:hidden" aria-label="Hoofdnavigatie">
        {MOBILE_NAV.slice(0, 2).map((item) => (
          <BottomItem key={item.href} item={item} active={isActive(item.href)} badge={item.href === "/messages" ? unreadMessages : item.href === "/opportunities" ? unreadOpportunities : 0} />
        ))}
        <button
          onClick={() => { setCreateType(null); setCreateOpen(true); }}
          data-tour-id="create-post"
          className="mobile-tab-create press"
          aria-label="Plaats bericht"
        >
          <span><Plus size={21} strokeWidth={2.6} /></span>
          <small>Plaatsen</small>
        </button>
        {MOBILE_NAV.slice(2).map((item) => (
          <BottomItem key={item.href} item={item} active={isActive(item.href)} badge={item.href === "/messages" ? unreadMessages : item.href === "/opportunities" ? unreadOpportunities : 0} />
        ))}
      </nav>

      <CreatePostModal key={createType ?? "default"} />

      {/* Help system */}
      <ProductTour />
      <VyntaAssistant />

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-24 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4 lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0 lg:items-end">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="pointer-events-auto flex w-full items-start gap-3 rounded-md border border-border bg-surface p-4 shadow-lg"
            >
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.body && <p className="mt-0.5 text-sm text-muted">{t.body}</p>}
              </div>
              <button onClick={() => dismissToast(t.id)} className="text-muted hover:text-foreground">
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function NavRow({ item, active, badge }: { item: typeof NAV[0]; active: boolean; badge: number }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-md px-3 py-3 text-[14px] font-semibold transition-colors",
        active ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white"
      )}
    >
      {active && <span className="absolute left-0 top-1/2 h-7 w-0.5 -translate-y-1/2 bg-brand" />}
      <span className={cn(
        "grid h-8 w-8 place-items-center rounded-sm transition-colors",
        active ? "bg-brand text-white" : "bg-white/5 text-white/45 group-hover:text-white"
      )}>
        <item.icon size={20} strokeWidth={active ? 2.4 : 2} />
      </span>
      {item.label}
      {badge > 0 && (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-semibold text-brand-fg">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}

function BottomItem({ item, active, badge }: { item: typeof NAV[0]; active: boolean; badge: number }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "mobile-tab-item relative flex min-w-0 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-colors",
        active ? "text-foreground" : "text-muted"
      )}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
    >
      <span className="relative grid h-7 w-7 place-items-center">
        <item.icon size={22} strokeWidth={active ? 2.4 : 2} />
        {badge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand px-1 text-[8px] font-semibold text-brand-fg">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function Logo({ height = 40 }: { height?: number }) {
  return (
    <ThemedLogo height={height} fallbackSrc="/logo.png" />
  );
}
