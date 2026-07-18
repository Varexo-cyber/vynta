"use client";

import { useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";
import { useApp } from "./app-store";
import { CompanyAvatar } from "./ui/primitives";
import { CreatePostModal } from "./create-post-modal";
import { SidebarBrandBackup } from "./sidebar-brand-backup";
import { ThemedLogo } from "./themed-logo";
import { VyntaAssistant } from "./help/vynta-assistant";
import { ProductTour } from "./help/product-tour";
import { useNativeFeatures, setStatusBarDark } from "@/lib/capacitor";

const NAV = [
  { href: "/feed", label: "Feed", icon: Home, tourId: "feed" },
  { href: "/search", label: "Zoeken", icon: Search, tourId: "search" },
  { href: "/networks", label: "Netwerken", icon: Users, tourId: "networks" },
  { href: "/opportunities", label: "Kansen", icon: Target, tourId: "opportunities" },
  { href: "/messages", label: "Berichten", icon: MessageSquare, tourId: "messages" },
];

const MOBILE_NAV = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/opportunities", label: "Kansen", icon: Target },
  { href: "/networks", label: "Netwerken", icon: Users },
  { href: "/messages", label: "Berichten", icon: MessageSquare },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { resolved, toggle } = useTheme();
  const { me, setCreateOpen, setCreateType, createType, unreadMessages, unreadNotifications, unreadOpportunities, toasts, dismissToast } = useApp();
  const { isNative } = useNativeFeatures();
  const isActive = (href: string) =>
    href === "/feed" ? pathname === "/feed" || pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    setStatusBarDark(resolved === "dark");
  }, [resolved]);

  return (
    <div className="relative min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex flex-1 flex-col px-5 py-7">
          <SidebarBrandBackup />

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
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-background transition-all hover:opacity-90 press shimmer"
          >
            <Plus size={18} strokeWidth={2.5} />
            Plaats bericht
          </button>

          <div className="mt-auto flex flex-col gap-2">
            <Link
              href="/saved"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith("/saved") ? "bg-surface-2 text-foreground" : "text-muted hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <Bookmark size={20} />
              Opgeslagen
            </Link>
            <Link
              href="/settings"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith("/settings") ? "bg-surface-2 text-foreground" : "text-muted hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <Settings size={20} />
              Instellingen
            </Link>
            <button
              onClick={toggle}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              {resolved === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              {resolved === "dark" ? "Licht thema" : "Donker thema"}
            </button>
          </div>
        </div>

        <Link
          href={`/company/${me.id}`}
          data-tour-id="company-profile"
          className="flex items-center gap-3 border-t border-border p-5 transition-colors hover:bg-surface-2"
        >
          <CompanyAvatar name={me.name} color={me.logoColor} logoUrl={me.logoUrl} website={me.website} size={42} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{me.name}</p>
            <p className="truncate text-xs text-muted">Mijn bedrijf</p>
          </div>
        </Link>
      </aside>

      {/* Mobile header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/feed" className="flex items-center">
          <Logo height={30} />
        </Link>
        <div className="flex items-center gap-1">
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
          <Link href={`/company/${me.id}`} className="rounded-full p-0.5">
            <CompanyAvatar name={me.name} color={me.logoColor} logoUrl={me.logoUrl} website={me.website} size={32} />
          </Link>
        </div>
      </header>

      <main className="min-h-screen pt-14 pb-20 lg:pb-0 lg:pl-[260px]">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)] lg:hidden">
        {MOBILE_NAV.slice(0, 2).map((item) => (
          <BottomItem key={item.href} item={item} active={isActive(item.href)} badge={item.href === "/messages" ? unreadMessages : item.href === "/opportunities" ? unreadOpportunities : 0} />
        ))}
        <button
          onClick={() => { setCreateType(null); setCreateOpen(true); }}
          data-tour-id="create-post"
          className="grid h-12 w-12 place-items-center rounded-full bg-foreground text-background shadow-lg press shimmer"
          aria-label="Plaats bericht"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
        {MOBILE_NAV.slice(2).map((item) => (
          <BottomItem key={item.href} item={item} active={isActive(item.href)} badge={item.href === "/messages" ? unreadMessages : item.href === "/opportunities" ? unreadOpportunities : 0} />
        ))}
        <Link
          href={`/company/${me.id}`}
          className={cn(
            "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
            pathname === `/company/${me.id}` ? "text-foreground" : "text-muted"
          )}
          aria-label="Profiel"
        >
          <span className="relative grid h-7 w-7 place-items-center">
            <CompanyAvatar name={me.name} color={me.logoColor} logoUrl={me.logoUrl} website={me.website} size={26} />
          </span>
        </Link>
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
              className="pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xl"
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
        "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold transition-all duration-200",
        active ? "bg-surface-2 text-foreground" : "text-muted hover:bg-surface-2 hover:text-foreground"
      )}
    >
      {active && <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-brand" />}
      <span className={cn(
        "grid h-9 w-9 place-items-center rounded-lg transition-colors",
        active ? "bg-foreground text-background" : "bg-surface-2 text-muted group-hover:text-foreground"
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

function BottomItem({ item, active, badge }: { item: { href: string; label: string; icon: typeof Home }; active: boolean; badge: number }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-colors",
        active ? "text-foreground" : "text-muted"
      )}
    >
      <span className="relative grid h-7 w-7 place-items-center">
        <item.icon size={22} strokeWidth={active ? 2.4 : 2} />
        {badge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand px-1 text-[8px] font-semibold text-brand-fg">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
    </Link>
  );
}

export function Logo({ height = 40 }: { height?: number }) {
  return (
    <ThemedLogo height={height} fallbackSrc="/logo.png" />
  );
}
