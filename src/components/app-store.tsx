"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Company, Network, PostType, Draft } from "@/lib/types";

type Toast = { id: number; title: string; body?: string };

interface AppValue {
  me: Company;
  companies: Record<string, Company>;
  myNetworks: Network[];
  networks: Network[];
  networkById: (id: string) => Network | undefined;
  followingIds: Set<string>;
  followedNetworkIds: Set<string>;
  unreadMessages: number;
  unreadNotifications: number;
  unreadOpportunities: number;
  companyById: (id: string) => Company | undefined;
  createOpen: boolean;
  setCreateOpen: (v: boolean) => void;
  createType: PostType | null;
  setCreateType: (v: PostType | null) => void;
  draftToLoad: Draft | null;
  setDraftToLoad: (v: Draft | null) => void;
  toasts: Toast[];
  toast: (title: string, body?: string) => void;
  dismissToast: (id: number) => void;
}

const AppContext = createContext<AppValue | null>(null);

export function AppProvider({
  me,
  companies,
  myNetworks,
  networks,
  followingIds,
  followedNetworkIds,
  unreadMessages,
  unreadNotifications,
  unreadOpportunities,
  children,
}: {
  me: Company;
  companies: Record<string, Company>;
  myNetworks: Network[];
  networks: Network[];
  followingIds: string[];
  followedNetworkIds: string[];
  unreadMessages: number;
  unreadNotifications: number;
  unreadOpportunities: number;
  children: React.ReactNode;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<PostType | null>(null);
  const [draftToLoad, setDraftToLoad] = useState<Draft | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((title: string, body?: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, title, body }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const dismissToast = useCallback(
    (id: number) => setToasts((t) => t.filter((x) => x.id !== id)),
    []
  );

  const companyById = useCallback((id: string) => companies[id], [companies]);
  const networkById = useCallback(
    (id: string) => networks.find((n) => n.id === id),
    [networks]
  );

  const value = useMemo<AppValue>(
    () => ({
      me,
      companies,
      myNetworks,
      networks,
      networkById,
      followingIds: new Set(followingIds),
      followedNetworkIds: new Set(followedNetworkIds),
      unreadMessages,
      unreadNotifications,
      unreadOpportunities,
      companyById,
      createOpen,
      setCreateOpen,
      createType,
      setCreateType,
      draftToLoad,
      setDraftToLoad,
      toasts,
      toast,
      dismissToast,
    }),
    [me, companies, myNetworks, networks, networkById, followingIds, followedNetworkIds, unreadMessages, unreadNotifications, unreadOpportunities, companyById, createOpen, createType, draftToLoad, toasts, toast, dismissToast]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
