"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Send,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Play,
  BookOpen,
  Navigation,
  Minus,
  AlertCircle,
  ChevronDown,
  FileText,
  Building2,
  Users,
  MessageCircle,
  Bell,
  Search,
  Rss,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { useHelp } from "@/components/help/help-provider";
import { helpActions, type HelpActionId } from "@/lib/help-actions";
import { getArticleById } from "@/lib/help-knowledge";
import { ThemedLogo } from "@/components/themed-logo";
import { cn } from "@/lib/utils";

type QuickAction = {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle: string;
  query: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: FileText,
    title: "Bericht plaatsen",
    subtitle: "Deel een vraag, aanbod of vacature",
    query: "Hoe plaats ik een bericht?",
  },
  {
    icon: Building2,
    title: "Bedrijfsprofiel wijzigen",
    subtitle: "Pas je logo, banner en gegevens aan",
    query: "Hoe wijzig ik mijn bedrijfsprofiel?",
  },
  {
    icon: Users,
    title: "Netwerken begrijpen",
    subtitle: "Bekijk gemeente-, provincie- en branchenetwerken",
    query: "Hoe werken netwerken?",
  },
  {
    icon: MessageCircle,
    title: "Een bedrijf benaderen",
    subtitle: "Start direct een zakelijk gesprek",
    query: "Hoe stuur ik een bedrijf een bericht?",
  },
  {
    icon: Rss,
    title: "Vacature plaatsen",
    subtitle: "Bereik kandidaten in je netwerk",
    query: "Hoe plaats ik een vacature?",
  },
  {
    icon: Bell,
    title: "Meldingen aanpassen",
    subtitle: "Beheer wat je ontvangt",
    query: "Hoe wijzig ik mijn meldingen?",
  },
];

const CONTEXT_CARDS: Record<string, { title: string; body: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  feed: { title: "Je bent op de Feed", body: "Hier kun je berichten plaatsen, filteren en jouw netwerken volgen.", icon: Rss },
  networks: { title: "Je bekijkt Netwerken", body: "Ik help je deelnemen, zoeken of bereik begrijpen.", icon: Users },
  messages: { title: "Je bent bij Berichten", body: "Ik help je met chats, bestanden en oproepen.", icon: MessageCircle },
  search: { title: "Je bent bij Zoeken", body: "Ik help je bedrijven, producten of vacatures vinden.", icon: Search },
  settings: { title: "Je bent bij Instellingen", body: "Ik help je met bedrijfsgegevens, thema of voorkeuren.", icon: Building2 },
  company: { title: "Je bekijkt een bedrijfsprofiel", body: "Ik help je logo, banner en gegevens aanpassen.", icon: Building2 },
};

function getContextKey(route: string): string | null {
  if (route.startsWith("/networks")) return "networks";
  if (route.startsWith("/feed")) return "feed";
  if (route.startsWith("/messages")) return "messages";
  if (route.startsWith("/search")) return "search";
  if (route.startsWith("/settings")) return "settings";
  if (route.startsWith("/company")) return "company";
  return null;
}

function LauncherTooltip() {
  const [autoShow, setAutoShow] = useState(false);

  useEffect(() => {
    try {
      const key = "vynta-launcher-tooltip-count";
      const count = parseInt(localStorage.getItem(key) ?? "0", 10);
      if (count < 3) {
        const t1 = setTimeout(() => setAutoShow(true), 800);
        const t2 = setTimeout(() => setAutoShow(false), 5000);
        localStorage.setItem(key, String(count + 1));
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      }
    } catch {
      // localStorage unavailable — skip tooltip
    }
  }, []);

  return (
    <span
      className={cn(
        "pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground shadow-md transition-opacity duration-200",
        autoShow ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}
      aria-hidden="true"
    >
      Hulp nodig?
      <span className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 translate-x-1 rotate-45 border-r border-t border-border bg-surface" />
    </span>
  );
}

function ConversationList({
  conversations,
  currentConversationId,
  renamingId,
  renameValue,
  onOpen,
  onRenameStart,
  onRenameConfirm,
  onRenameCancel,
  onRenameChange,
  onDelete,
}: {
  conversations: { id: string; title: string; updatedAt: string }[];
  currentConversationId: string | null;
  renamingId: string | null;
  renameValue: string;
  onOpen: (id: string) => void;
  onRenameStart: (id: string, title: string) => void;
  onRenameConfirm: () => void;
  onRenameCancel: () => void;
  onRenameChange: (value: string) => void;
  onDelete: (id: string) => void;
}) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: typeof conversations }[] = [
    { label: "Vandaag", items: [] },
    { label: "Gisteren", items: [] },
    { label: "Afgelopen 7 dagen", items: [] },
    { label: "Ouder", items: [] },
  ];

  for (const conv of conversations) {
    const d = new Date(conv.updatedAt);
    if (d >= today) groups[0].items.push(conv);
    else if (d >= yesterday) groups[1].items.push(conv);
    else if (d >= sevenDaysAgo) groups[2].items.push(conv);
    else groups[3].items.push(conv);
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) =>
        group.items.length === 0 ? null : (
          <div key={group.label}>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-subtle">
              {group.label}
            </p>
            <div className="flex flex-col gap-1">
              {group.items.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors",
                    conv.id === currentConversationId
                      ? "border-brand/30 bg-brand/5"
                      : "border-transparent hover:bg-surface-2"
                  )}
                >
                  {renamingId === conv.id ? (
                    <div className="flex flex-1 items-center gap-1.5">
                      <input
                        value={renameValue}
                        onChange={(e) => onRenameChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onRenameConfirm();
                          if (e.key === "Escape") onRenameCancel();
                        }}
                        autoFocus
                        className="flex-1 rounded-lg border border-border bg-surface px-2 py-1 text-sm outline-none focus:border-brand/40"
                      />
                      <button
                        onClick={onRenameConfirm}
                        className="text-xs font-semibold text-brand hover:opacity-80"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => onOpen(conv.id)}
                        className="flex-1 truncate text-left text-sm font-medium text-foreground"
                      >
                        {conv.title}
                      </button>
                      <button
                        onClick={() => onRenameStart(conv.id, conv.title)}
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-subtle opacity-0 transition-opacity hover:bg-surface-2 hover:text-foreground group-hover:opacity-100"
                        aria-label="Hernoemen"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => onDelete(conv.id)}
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-subtle opacity-0 transition-opacity hover:bg-surface-2 hover:text-red-500 group-hover:opacity-100"
                        aria-label="Verwijderen"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

export function VyntaAssistant() {
  const {
    assistantOpen,
    assistantMinimized,
    openAssistant,
    closeAssistant,
    toggleAssistant,
    minimizeAssistant,
    assistantMessages,
    assistantLoading,
    assistantUnreadCount,
    assistantLastError,
    sendAssistantQuery,
    retryLastQuery,
    sendAssistantFeedback,
    clearAssistantMessages,
    executeAction,
    startGuidedMode,
    currentRoute,
    assistantEnabled,
    conversations,
    currentConversationId,
    conversationsLoading,
    startNewConversation,
    openConversation,
    renameConversationAction,
    deleteConversationAction,
    searchConversationsAction,
    conversationSearchResults,
  } = useHelp();

  const [input, setInput] = useState("");
  const [showFeedbackReason, setShowFeedbackReason] = useState<string | null>(null);
  const [showAllActions, setShowAllActions] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(44);
  const [showConversations, setShowConversations] = useState(false);
  const [conversationSearchQuery, setConversationSearchQuery] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [assistantMessages, assistantLoading, assistantLastError]);

  useEffect(() => {
    if (!assistantOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (assistantMinimized) {
          closeAssistant();
        } else {
          minimizeAssistant();
        }
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [assistantOpen, assistantMinimized, closeAssistant, minimizeAssistant]);

  if (!assistantEnabled) return null;

  const handleSend = () => {
    const q = input.trim();
    if (!q || assistantLoading) return;
    sendAssistantQuery(q);
    setInput("");
    setTextareaHeight(44);
    if (textareaRef.current) textareaRef.current.style.height = "44px";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "44px";
    const newHeight = Math.min(el.scrollHeight, 120);
    el.style.height = `${newHeight}px`;
    setTextareaHeight(newHeight);
  };

  const contextKey = getContextKey(currentRoute);
  const contextCard = contextKey ? CONTEXT_CARDS[contextKey] : null;
  const visibleActions = showAllActions ? QUICK_ACTIONS : QUICK_ACTIONS.slice(0, 4);
  const hasMessages = assistantMessages.length > 0;

  return (
    <>
      {/* Launcher */}
      <AnimatePresence>
        {!assistantOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-20 right-4 z-[85] lg:bottom-6 lg:right-6"
            data-tour-id="vynta-assistant"
          >
            <div className="group relative">
              {/* Tooltip — auto-show first 3 visits, then only on hover */}
              <LauncherTooltip />

              {/* Logo as button — just the logo with subtle live effects */}
              <button
                onClick={toggleAssistant}
                className="vynta-breathe group relative flex h-[56px] w-[84px] items-center justify-center overflow-visible rounded-lg transition-all duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Open Vynta Assistent"
                title="Vynta Assistent"
              >
                <span className="vynta-glow-pulse flex items-center justify-center transition-all duration-200 group-hover:brightness-110">
                  <ThemedLogo height={56} fallbackSrc="/logo.png" />
                </span>

                {/* Unread badge */}
                {assistantUnreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-fg ring-2 ring-background">
                    {assistantUnreadCount > 9 ? "9+" : assistantUnreadCount}
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized label */}
      <AnimatePresence>
        {assistantOpen && assistantMinimized && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={() => { openAssistant(); }}
            className="fixed bottom-20 right-4 z-[85] flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 shadow-lg transition-all hover:bg-surface-2 press lg:bottom-6 lg:right-6"
          >
            <span className="flex h-[24px] w-[36px] shrink-0 items-center justify-center overflow-hidden">
              <ThemedLogo height={24} fallbackSrc="/logo.png" />
            </span>
            <span className="text-xs font-semibold">Hulp beschikbaar</span>
            {assistantUnreadCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-brand-fg">
                {assistantUnreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Assistant panel */}
      <AnimatePresence>
        {assistantOpen && !assistantMinimized && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "fixed z-[86] flex flex-col overflow-hidden border border-border bg-surface shadow-[0_8px_40px_-8px_rgba(0,0,0,0.25)]",
              "inset-x-0 bottom-0 rounded-t-[24px] h-[88vh] max-h-[640px]",
              "lg:inset-x-auto lg:bottom-6 lg:right-6 lg:h-auto lg:w-[400px] lg:rounded-[24px] lg:max-h-[78vh]"
            )}
            role="dialog"
            aria-label="Vynta Assistent"
          >
            {/* Mobile drag handle */}
            <div className="flex justify-center pt-2.5 pb-1 lg:hidden">
              <span className="h-1 w-10 rounded-full bg-border-strong" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2.5">
                {/* Assistant icon — fixed wrapper for both themes */}
                <div className="relative h-9 w-[54px] shrink-0">
                  <div className="flex h-9 w-[54px] items-center justify-center overflow-hidden">
                    <ThemedLogo height={36} fallbackSrc="/logo.png" />
                  </div>
                  {/* Processing ring */}
                  {assistantLoading && (
                    <span className="pointer-events-none absolute -inset-0.5 rounded-xl border border-brand/40 vynta-process-ring" />
                  )}
                  {/* Status dot */}
                  {!assistantLoading && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-surface" />
                  )}
                </div>
                <div>
                  <p className="text-[13px] font-semibold tracking-tight">Vynta Assistent</p>
                  <p className="flex items-center gap-1 text-[11px] text-muted">
                    <span className={cn("h-1.5 w-1.5 rounded-full", assistantLoading ? "bg-brand" : "bg-green-500")} />
                    {assistantLoading ? "Bezig met zoeken…" : "Klaar om te helpen"}
                  </p>
                </div>
              </div>
              {/* Header actions — fully separate buttons, transparent wrapper only */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowConversations((v) => !v)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                    showConversations
                      ? "bg-surface-2 text-foreground"
                      : "text-muted hover:bg-surface-2 hover:text-foreground"
                  )}
                  aria-label="Eerdere gesprekken"
                  title="Gesprekken"
                >
                  Gesprekken
                </button>
                {hasMessages && (
                  <button
                    onClick={clearAssistantMessages}
                    className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    aria-label="Gesprek wissen"
                    title="Wissen"
                  >
                    Wissen
                  </button>
                )}
                {/* Spacer to separate text buttons from icon buttons */}
                <div className="w-1.5 shrink-0" aria-hidden="true" />
                <button
                  onClick={minimizeAssistant}
                  className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  aria-label="Minimaliseren"
                  title="Minimaliseren"
                >
                  <Minus size={16} />
                </button>
                <button
                  onClick={closeAssistant}
                  className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  aria-label="Sluiten"
                  title="Sluiten"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Progress line during loading */}
            {assistantLoading && (
              <div className="relative h-0.5 overflow-hidden bg-border">
                <div className="absolute inset-y-0 w-1/3 bg-brand vynta-progress-line" />
              </div>
            )}

            {/* Content area */}
            {showConversations ? (
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {/* New conversation button */}
                <button
                  onClick={() => {
                    startNewConversation();
                    setShowConversations(false);
                  }}
                  className="mb-3 flex w-full items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-sm font-semibold transition-colors hover:bg-surface-2 press"
                >
                  <Plus size={16} className="text-brand" />
                  Nieuw gesprek
                </button>

                {/* Search */}
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-surface-2/40 px-3 py-2">
                  <Search size={14} className="shrink-0 text-muted" />
                  <input
                    value={conversationSearchQuery}
                    onChange={(e) => {
                      setConversationSearchQuery(e.target.value);
                      searchConversationsAction(e.target.value);
                    }}
                    placeholder="Zoek in gesprekken…"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
                  />
                </div>

                {/* Conversation list */}
                {conversationsLoading ? (
                  <p className="py-8 text-center text-sm text-muted">Laden…</p>
                ) : (conversationSearchResults ?? conversations).length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted">
                    {conversationSearchQuery ? "Geen gesprekken gevonden." : "Nog geen eerdere gesprekken."}
                  </p>
                ) : (
                  <ConversationList
                    conversations={conversationSearchResults ?? conversations}
                    currentConversationId={currentConversationId}
                    renamingId={renamingId}
                    renameValue={renameValue}
                    onOpen={(id) => {
                      openConversation(id);
                      setShowConversations(false);
                      setConversationSearchQuery("");
                    }}
                    onRenameStart={(id, title) => {
                      setRenamingId(id);
                      setRenameValue(title);
                    }}
                    onRenameConfirm={() => {
                      if (renamingId) {
                        renameConversationAction(renamingId, renameValue);
                      }
                      setRenamingId(null);
                    }}
                    onRenameCancel={() => setRenamingId(null)}
                    onRenameChange={setRenameValue}
                    onDelete={(id) => deleteConversationAction(id)}
                  />
                )}
              </div>
            ) : (
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
              {/* Context card (only when no messages) */}
              {!hasMessages && contextCard && (
                <ContextCard icon={contextCard.icon} title={contextCard.title} body={contextCard.body} />
              )}

              {/* Messages */}
              {hasMessages && (
                <div className="flex flex-col gap-3">
                  {assistantMessages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      onAction={executeAction}
                      onGuidedMode={startGuidedMode}
                      onFeedback={sendAssistantFeedback}
                      onClarify={sendAssistantQuery}
                      showFeedbackReason={showFeedbackReason}
                      setShowFeedbackReason={setShowFeedbackReason}
                    />
                  ))}

                  {/* Typing indicator */}
                  {assistantLoading && (
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-[33px] shrink-0 items-center justify-center overflow-hidden">
                        <ThemedLogo height={22} fallbackSrc="/logo.png" />
                      </div>
                      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md bg-surface-2/60 px-3.5 py-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand vynta-typing-dot" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-brand vynta-typing-dot" style={{ animationDelay: "200ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-brand vynta-typing-dot" style={{ animationDelay: "400ms" }} />
                        <span className="ml-1 text-xs text-muted">Vynta zoekt het voor je uit…</span>
                      </div>
                    </div>
                  )}

                  {/* Error card */}
                  {assistantLastError && !assistantLoading && (
                    <ErrorCard onRetry={retryLastQuery} onHelpCenter={() => executeAction("OPEN_HELP_CENTER" as HelpActionId)} />
                  )}
                </div>
              )}

              {/* Quick actions (only when no messages) */}
              {!hasMessages && (
                <div className="mt-3">
                  <div className="flex flex-col gap-2">
                    {visibleActions.map((action) => (
                      <QuickActionCard
                        key={action.title}
                        action={action}
                        onClick={() => sendAssistantQuery(action.query)}
                      />
                    ))}
                  </div>
                  {!showAllActions && QUICK_ACTIONS.length > 4 && (
                    <button
                      onClick={() => setShowAllActions(true)}
                      className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                    >
                      Meer onderwerpen
                      <ChevronDown size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
            )}

            {/* Composer */}
            <div className="border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface-2/40 px-3 py-2 transition-colors focus-within:border-brand/40">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Vraag iets over Vynta…"
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted"
                  style={{ height: `${textareaHeight}px`, maxHeight: "120px" }}
                  aria-label="Bericht aan Vynta Assistent"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || assistantLoading}
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all press",
                    input.trim() && !assistantLoading
                      ? "bg-brand text-brand-fg hover:opacity-90 shadow-[0_2px_12px_-2px_var(--brand)]"
                      : "bg-surface-3 text-subtle"
                  )}
                  aria-label="Verzenden"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ContextCard({ icon: Icon, title, body }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; body: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-2/30 p-3.5">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/10">
          <Icon size={18} className="text-brand" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold tracking-tight">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{body}</p>
        </div>
      </div>
      {/* Accent sweep line */}
      <div className="mt-2.5 h-0.5 overflow-hidden rounded-full bg-border">
        <div className="h-full w-1/4 rounded-full bg-brand vynta-accent-sweep" />
      </div>
    </div>
  );
}

function QuickActionCard({ action, onClick }: { action: QuickAction; onClick: () => void }) {
  const Icon = action.icon;
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-3 text-left transition-all hover:border-brand/30 hover:bg-surface-2/40 press"
    >
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted transition-colors group-hover:bg-brand/10 group-hover:text-brand">
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold tracking-tight">{action.title}</p>
        <p className="truncate text-[11px] text-muted">{action.subtitle}</p>
      </div>
      <ArrowRight size={15} className="shrink-0 text-subtle transition-colors group-hover:text-brand" />
    </button>
  );
}

function ErrorCard({ onRetry, onHelpCenter }: { onRetry: () => void; onHelpCenter: () => void }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface-2/30 p-4">
      <div className="flex items-start gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/10">
          <AlertCircle size={16} className="text-brand" />
        </div>
        <div>
          <p className="text-[13px] font-semibold">Dat lukte niet</p>
          <p className="mt-0.5 text-xs text-muted">Ik kon het antwoord nu niet ophalen.</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-all hover:opacity-90 press"
        >
          Opnieuw proberen
        </button>
        <button
          onClick={onHelpCenter}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted transition-all hover:bg-surface-2 hover:text-foreground press"
        >
          <BookOpen size={12} />
          Open Helpcentrum
        </button>
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  onAction,
  onGuidedMode,
  onFeedback,
  onClarify,
  showFeedbackReason,
  setShowFeedbackReason,
}: {
  msg: import("@/components/help/help-provider").AssistantMessage;
  onAction: (id: HelpActionId) => void;
  onGuidedMode: (tourId: string) => void;
  onFeedback: (messageId: string, helpful: boolean, reason?: string) => void;
  onClarify: (query: string) => void;
  showFeedbackReason: string | null;
  setShowFeedbackReason: (id: string | null) => void;
}) {
  const isUser = msg.role === "user";
  const article = msg.articleId ? getArticleById(msg.articleId) : null;

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-foreground px-3.5 py-2.5 text-sm leading-relaxed text-background">
          <p>{msg.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start">
      <div className="flex items-start gap-2.5">
        {/* Assistant icon — fixed wrapper for both themes */}
        <div className="flex h-7 w-[33px] shrink-0 items-center justify-center overflow-hidden">
          <ThemedLogo height={22} fallbackSrc="/logo.png" />
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-surface-2/60 px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
          <p>{msg.text}</p>
          {msg.clarificationOptions && msg.clarificationOptions.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {msg.clarificationOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => onClarify(opt.query)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-1.5 text-[11px] font-semibold text-background transition-all hover:opacity-90 press"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          {msg.steps && msg.steps.length > 0 && (
            <ol className="mt-2.5 space-y-1.5 border-t border-border/50 pt-2.5">
              {msg.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs">
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
                    {i + 1}
                  </span>
                  <span className="text-muted">{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {msg.found && msg.actions && msg.actions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 pl-9">
          {msg.actions.map((actionId) => {
            const action = helpActions[actionId];
            if (!action) return null;
            return (
              <button
                key={actionId}
                onClick={() => onAction(actionId)}
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-1.5 text-[11px] font-semibold text-background transition-all hover:opacity-90 press"
              >
                <Navigation size={11} />
                {action.label}
              </button>
            );
          })}
          {msg.tourId && (
            <button
              onClick={() => onGuidedMode(msg.tourId!)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-foreground transition-all hover:bg-surface-2 press"
            >
              <Play size={11} />
              Laat het mij zien
            </button>
          )}
          {article && (
            <button
              onClick={() => onAction("OPEN_HELP_CENTER" as HelpActionId)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-muted transition-all hover:bg-surface-2 hover:text-foreground press"
            >
              <BookOpen size={11} />
              Open uitleg
            </button>
          )}
        </div>
      )}

      {/* Feedback */}
      {msg.found && msg.feedback === null && (
        <div className="mt-1.5 flex items-center gap-1.5 pl-9">
          <span className="text-[11px] text-subtle">Nuttig?</span>
          <button
            onClick={() => onFeedback(msg.id, true)}
            className="grid h-6 w-6 place-items-center rounded-full text-subtle transition-colors hover:bg-surface-2 hover:text-brand"
            aria-label="Ja, nuttig"
          >
            <ThumbsUp size={12} />
          </button>
          <button
            onClick={() => setShowFeedbackReason(msg.id)}
            className="grid h-6 w-6 place-items-center rounded-full text-subtle transition-colors hover:bg-surface-2 hover:text-foreground"
            aria-label="Nee, niet nuttig"
          >
            <ThumbsDown size={12} />
          </button>
        </div>
      )}

      {/* Feedback reason */}
      {showFeedbackReason === msg.id && (
        <div className="mt-1.5 flex flex-col gap-1 rounded-xl border border-border bg-surface-2/30 p-2.5 pl-9">
          {[
            { reason: "unclear", label: "Antwoord was onduidelijk" },
            { reason: "wrong_steps", label: "Stappen klopten niet" },
            { reason: "not_found", label: "Functie kon ik niet vinden" },
            { reason: "other", label: "Anders" },
          ].map((opt) => (
            <button
              key={opt.reason}
              onClick={() => {
                onFeedback(msg.id, false, opt.reason);
                setShowFeedbackReason(null);
              }}
              className="text-left text-[11px] text-muted transition-colors hover:text-foreground"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Feedback submitted */}
      {msg.feedback !== null && (
        <p className="mt-1 pl-9 text-[11px] text-subtle">Bedankt voor je feedback.</p>
      )}
    </div>
  );
}
