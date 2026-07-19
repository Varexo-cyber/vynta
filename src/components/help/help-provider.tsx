"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import type { TourDef, TourStep } from "@/lib/help-tours";
import { PRODUCT_TOUR, GUIDED_TOURS, getTour } from "@/lib/help-tours";
import { CHECKLIST_TASKS, getChecklistProgress } from "@/lib/help-checklist";
import type { HelpActionId } from "@/lib/help-actions";
import { helpActions, resolveActionRoute } from "@/lib/help-actions";
import {
  getOnboardingState,
  updateOnboardingStep,
  completeOnboarding,
  skipOnboarding,
  getChecklistState,
  completeChecklistTask,
  hideChecklist,
  showChecklist,
  updateTourProgress,
  completeTour,
  skipTour,
  submitHelpFeedback,
  getHelpPreferences,
  updateHelpPreferences,
} from "@/lib/help-actions-server";
import {
  createConversation,
  listConversations,
  getConversationMessages,
  renameConversation,
  deleteConversation,
  searchConversations,
  saveMessage,
  updateMessageFeedback,
  updateConversationSummary,
  processAssistantQueryV2,
  type AssistantConversation,
} from "@/lib/assistant-server";
import { useApp } from "@/components/app-store";
import type { PostType } from "@/lib/types";

export type ExperienceLevel = "basic" | "normal" | "extensive";

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  articleId?: string | null;
  steps?: string[];
  actions?: HelpActionId[];
  tourId?: string;
  found: boolean;
  feedback?: "yes" | "no" | null;
  clarificationOptions?: { label: string; query: string }[];
}

interface HelpContextValue {
  /* Onboarding */
  onboardingStatus: string;
  onboardingStep: number;
  onboardingGoals: string[];
  experienceLevel: ExperienceLevel;
  setExperienceLevel: (level: ExperienceLevel) => void;
  saveOnboardingStep: (step: number) => void;
  finishOnboarding: (goals: string[], level: ExperienceLevel) => void;
  skipOnboardingFlow: () => void;
  refreshOnboarding: () => void;

  /* Checklist */
  checklistCompleted: Set<string>;
  checklistHidden: boolean;
  checklistAutoDetected: Record<string, boolean>;
  checklistProgress: { done: number; total: number; percentage: number };
  completeTask: (taskId: string) => void;
  hideChecklistWidget: () => void;
  showChecklistWidget: () => void;
  refreshChecklist: () => void;

  /* Tours */
  activeTour: TourDef | null;
  tourStepIndex: number;
  startTour: (tourId: string) => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  endTour: (completed: boolean) => void;
  currentTourStep: TourStep | null;

  /* Assistant */
  assistantOpen: boolean;
  assistantMinimized: boolean;
  assistantMessages: AssistantMessage[];
  assistantLoading: boolean;
  assistantUnreadCount: number;
  assistantLastError: boolean;
  openAssistant: () => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
  minimizeAssistant: () => void;
  sendAssistantQuery: (query: string) => void;
  retryLastQuery: () => void;
  sendAssistantFeedback: (messageId: string, helpful: boolean, reason?: string, correction?: string) => void;
  clearAssistantMessages: () => void;

  /* Conversation management */
  conversations: AssistantConversation[];
  currentConversationId: string | null;
  conversationsLoading: boolean;
  startNewConversation: () => void;
  openConversation: (id: string) => void;
  renameConversationAction: (id: string, title: string) => void;
  deleteConversationAction: (id: string) => void;
  searchConversationsAction: (query: string) => void;
  conversationSearchResults: AssistantConversation[] | null;

  /* Guided mode */
  guidedModeActive: boolean;
  startGuidedMode: (tourId: string) => void;
  stopGuidedMode: () => void;

  /* Preferences */
  assistantEnabled: boolean;
  productTipsEnabled: boolean;
  setAssistantEnabled: (v: boolean) => void;
  setProductTipsEnabled: (v: boolean) => void;

  /* Context */
  currentRoute: string;

  /* Actions */
  executeAction: (actionId: HelpActionId) => void;
}

const HelpContext = createContext<HelpContextValue | null>(null);

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { me, myNetworks, setCreateOpen, setCreateType } = useApp();

  /* Onboarding state */
  const [onboardingStatus, setOnboardingStatus] = useState("pending");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingGoals, setOnboardingGoals] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevelState] = useState<ExperienceLevel>("normal");

  /* Checklist state */
  const [checklistCompleted, setChecklistCompleted] = useState<Set<string>>(new Set());
  const [checklistHidden, setChecklistHidden] = useState(false);

  /* Tour state */
  const [activeTour, setActiveTour] = useState<TourDef | null>(null);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  /* Assistant state */
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMinimized, setAssistantMinimized] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantUnreadCount, setAssistantUnreadCount] = useState(0);
  const [assistantLastError, setAssistantLastError] = useState(false);
  const lastQueryRef = useRef<string>("");

  /* Conversation management state */
  const [conversations, setConversations] = useState<AssistantConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationSearchResults, setConversationSearchResults] = useState<AssistantConversation[] | null>(null);

  /* Guided mode */
  const [guidedModeActive, setGuidedModeActive] = useState(false);

  /* Preferences */
  const [assistantEnabled, setAssistantEnabledState] = useState(true);
  const [productTipsEnabled, setProductTipsEnabledState] = useState(true);

  /* Load initial state */
  const loadOnboarding = useCallback(async () => {
    try {
      const state = await getOnboardingState();
      setOnboardingStatus(state.status);
      setOnboardingStep(state.step);
      setOnboardingGoals(state.goals);
      setExperienceLevelState(state.experienceLevel as ExperienceLevel);
    } catch {}
  }, []);

  const loadChecklist = useCallback(async () => {
    try {
      const state = await getChecklistState();
      setChecklistCompleted(new Set(state.completed));
      setChecklistHidden(state.hidden);
    } catch {}
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      const prefs = await getHelpPreferences();
      setAssistantEnabledState(prefs.assistantEnabled);
      setProductTipsEnabledState(prefs.productTipsEnabled);
      setExperienceLevelState(prefs.experienceLevel as ExperienceLevel);
    } catch {}
  }, []);

  /* Conversation management (declared early so it can be used in initial load) */
  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const list = await listConversations();
      setConversations(list);
    } catch {}
    setConversationsLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      loadOnboarding();
      loadChecklist();
      loadPreferences();
      loadConversations();
    });
  }, [loadOnboarding, loadChecklist, loadPreferences, loadConversations]);

  /* Auto-detect checklist */
  const checklistAutoDetected = useMemo(() => {
    const detect: Record<string, boolean> = {};
    for (const task of CHECKLIST_TASKS) {
      if (!task.detectKey) continue;
      switch (task.detectKey) {
        case "hasLogo":
          detect.hasLogo = !!me.logoUrl;
          break;
        case "hasDescription":
          detect.hasDescription = !!me.description && me.description.trim().length > 0;
          break;
        case "hasContact":
          detect.hasContact = !!(me.phone && me.email);
          break;
        case "hasMunicipalityNetwork":
          detect.hasMunicipalityNetwork = myNetworks.some((n) => n.type === "municipality");
          break;
        case "hasProvinceNetwork":
          detect.hasProvinceNetwork = myNetworks.some((n) => n.type === "province");
          break;
        case "hasIndustryNetwork":
          detect.hasIndustryNetwork = myNetworks.some((n) => n.type === "industry");
          break;
        case "hasPosted":
          detect.hasPosted = false;
          break;
        case "hasFollowed":
          detect.hasFollowed = false;
          break;
        case "hasConversed":
          detect.hasConversed = false;
          break;
      }
    }
    return detect;
  }, [me, myNetworks]);

  const checklistProgress = useMemo(
    () => getChecklistProgress(checklistCompleted, checklistAutoDetected),
    [checklistCompleted, checklistAutoDetected]
  );

  /* Onboarding actions */
  const setExperienceLevel = useCallback((level: ExperienceLevel) => {
    setExperienceLevelState(level);
  }, []);

  const saveOnboardingStep = useCallback(async (step: number) => {
    setOnboardingStep(step);
    try { await updateOnboardingStep(step); } catch {}
  }, []);

  const finishOnboarding = useCallback(
    async (goals: string[], level: ExperienceLevel) => {
      setOnboardingGoals(goals);
      setExperienceLevelState(level);
      setOnboardingStatus("completed");
      try { await completeOnboarding(goals, level); } catch {}
    },
    []
  );

  const skipOnboardingFlow = useCallback(async () => {
    setOnboardingStatus("skipped");
    try { await skipOnboarding(); } catch {}
  }, []);

  const refreshOnboarding = useCallback(() => { loadOnboarding(); }, [loadOnboarding]);

  /* Checklist actions */
  const completeTask = useCallback(async (taskId: string) => {
    setChecklistCompleted((s) => new Set([...s, taskId]));
    try { await completeChecklistTask(taskId); } catch {}
  }, []);

  const hideChecklistWidget = useCallback(async () => {
    setChecklistHidden(true);
    try { await hideChecklist(); } catch {}
  }, []);

  const showChecklistWidget = useCallback(async () => {
    setChecklistHidden(false);
    try { await showChecklist(); } catch {}
  }, []);

  const refreshChecklist = useCallback(() => { loadChecklist(); }, [loadChecklist]);

  /* Tour actions */
  const startTour = useCallback((tourId: string) => {
    const tour = getTour(tourId);
    if (!tour) return;
    setActiveTour(tour);
    setTourStepIndex(0);
    try { updateTourProgress(tourId, 0); } catch {}
  }, []);

  const nextTourStep = useCallback(() => {
    if (!activeTour) return;
    if (tourStepIndex < activeTour.steps.length - 1) {
      const next = tourStepIndex + 1;
      setTourStepIndex(next);
      try { updateTourProgress(activeTour.id, next); } catch {}
    } else {
      setActiveTour(null);
      setTourStepIndex(0);
      try { completeTour(activeTour.id); } catch {}
    }
  }, [activeTour, tourStepIndex]);

  const prevTourStep = useCallback(() => {
    if (tourStepIndex > 0) setTourStepIndex(tourStepIndex - 1);
  }, [tourStepIndex]);

  const endTour = useCallback(
    (completed: boolean) => {
      if (!activeTour) return;
      if (completed) {
        try { completeTour(activeTour.id); } catch {}
      } else {
        try { skipTour(activeTour.id); } catch {}
      }
      setActiveTour(null);
      setTourStepIndex(0);
    },
    [activeTour]
  );

  const currentTourStep = activeTour ? activeTour.steps[tourStepIndex] ?? null : null;

  /* Assistant actions */
  const openAssistant = useCallback(() => {
    setAssistantOpen(true);
    setAssistantMinimized(false);
    setAssistantUnreadCount(0);
  }, []);
  const closeAssistant = useCallback(() => {
    setAssistantOpen(false);
    setAssistantMinimized(false);
  }, []);
  const toggleAssistant = useCallback(() => {
    setAssistantOpen((v) => {
      if (!v) {
        setAssistantUnreadCount(0);
        setAssistantMinimized(false);
      }
      return !v;
    });
  }, []);
  const minimizeAssistant = useCallback(() => {
    setAssistantMinimized(true);
  }, []);

  const sendAssistantQuery = useCallback(
    async (query: string) => {
      lastQueryRef.current = query;
      const userMsg: AssistantMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        text: query,
        found: true,
      };
      setAssistantMessages((m) => [...m, userMsg]);
      setAssistantLoading(true);
      setAssistantLastError(false);
      try {
        // Ensure we have a conversation
        let convId = currentConversationId;
        if (!convId) {
          convId = await createConversation(pathname);
          setCurrentConversationId(convId);
        }

        // Save user message to DB
        saveMessage(convId, "user", query).catch(() => {});

        // Pass recent conversation history (last 10 messages) for context
        const history = assistantMessages.slice(-10).map((m) => ({
          role: m.role,
          text: m.text,
        }));
        const result = await processAssistantQueryV2(query, pathname, history, convId);
        const botMsg: AssistantMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: result.answer,
          articleId: result.articleId,
          steps: result.steps,
          actions: result.actions as HelpActionId[] | undefined,
          tourId: result.tourId,
          found: result.found,
          feedback: null,
          clarificationOptions: result.clarificationOptions,
        };
        setAssistantMessages((m) => [...m, botMsg]);
        if (assistantMinimized) {
          setAssistantUnreadCount((c) => c + 1);
        }

        // Save assistant message to DB
        saveMessage(convId, "assistant", result.answer, {
          intent: result.intent,
          confidence: result.confidence,
          source: result.source,
          articleId: result.articleId,
          actionId: result.actions?.[0] ?? null,
        }).catch(() => {});

        // Update conversation summary periodically
        if (assistantMessages.length > 0 && assistantMessages.length % 4 === 0) {
          updateConversationSummary(convId).catch(() => {});
        }

        // Refresh conversation list
        listConversations().then(setConversations).catch(() => {});
      } catch {
        setAssistantLastError(true);
      }
      setAssistantLoading(false);
    },
    [pathname, assistantMinimized, assistantMessages, currentConversationId]
  );

  const retryLastQuery = useCallback(() => {
    if (lastQueryRef.current) {
      setAssistantMessages((m) => {
        const lastUserIdx = [...m].reverse().findIndex((msg) => msg.role === "user");
        if (lastUserIdx === -1) return m;
        const actualIdx = m.length - 1 - lastUserIdx;
        return m.filter((_, i) => i !== actualIdx);
      });
      sendAssistantQuery(lastQueryRef.current);
    }
  }, [sendAssistantQuery]);

  const sendAssistantFeedback = useCallback(
    async (messageId: string, helpful: boolean, reason?: string, correction?: string) => {
      setAssistantMessages((msgs) =>
        msgs.map((m) =>
          m.id === messageId ? { ...m, feedback: helpful ? "yes" : "no" } : m
        )
      );
      const msg = assistantMessages.find((m) => m.id === messageId);
      try {
        await submitHelpFeedback(msg?.articleId ?? null, msg?.text ?? "", helpful, reason);
        // Also persist to assistant feedback system if we have a DB message ID
        if (currentConversationId) {
          // Find the DB message ID — we use the client-side ID for now
          // The saveMessage function returns the DB ID, but we stored it with client IDs
          // For now, we'll use the client ID as a reference
        }
      } catch {}
    },
    [assistantMessages, currentConversationId]
  );

  const clearAssistantMessages = useCallback(() => {
    setAssistantMessages([]);
    setCurrentConversationId(null);
  }, []);

  /* Conversation management */
  const startNewConversation = useCallback(() => {
    setAssistantMessages([]);
    setCurrentConversationId(null);
    setAssistantLastError(false);
  }, []);

  const openConversation = useCallback(async (id: string) => {
    setConversationsLoading(true);
    try {
      const messages = await getConversationMessages(id);
      setCurrentConversationId(id);
      setAssistantMessages(
        messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          text: m.content,
          articleId: m.articleId,
          found: true,
          feedback: m.feedbackHelpful === true ? "yes" : m.feedbackHelpful === false ? "no" : null,
        }))
      );
      setAssistantOpen(true);
      setAssistantMinimized(false);
      setAssistantLastError(false);
    } catch {}
    setConversationsLoading(false);
  }, []);

  const renameConversationAction = useCallback(async (id: string, title: string) => {
    try {
      await renameConversation(id, title);
      setConversations((list) => list.map((c) => (c.id === id ? { ...c, title } : c)));
    } catch {}
  }, []);

  const deleteConversationAction = useCallback(async (id: string) => {
    try {
      await deleteConversation(id);
      setConversations((list) => list.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        setAssistantMessages([]);
        setCurrentConversationId(null);
      }
    } catch {}
  }, [currentConversationId]);

  const searchConversationsAction = useCallback(async (query: string) => {
    if (!query.trim()) {
      setConversationSearchResults(null);
      return;
    }
    try {
      const results = await searchConversations(query);
      setConversationSearchResults(results);
    } catch {}
  }, []);

  /* Guided mode */
  const startGuidedMode = useCallback(
    (tourId: string) => {
      const tour = getTour(tourId);
      if (!tour) return;
      setGuidedModeActive(true);
      setActiveTour(tour);
      setTourStepIndex(0);
      setAssistantOpen(false);
      try { updateTourProgress(tourId, 0); } catch {}
    },
    []
  );

  const stopGuidedMode = useCallback(() => {
    setGuidedModeActive(false);
    setActiveTour(null);
    setTourStepIndex(0);
  }, []);

  /* Preferences */
  const setAssistantEnabled = useCallback(async (v: boolean) => {
    setAssistantEnabledState(v);
    try { await updateHelpPreferences({ assistantEnabled: v }); } catch {}
  }, []);

  const setProductTipsEnabled = useCallback(async (v: boolean) => {
    setProductTipsEnabledState(v);
    try { await updateHelpPreferences({ productTipsEnabled: v }); } catch {}
  }, []);

  /* Execute action */
  const executeAction = useCallback(
    (actionId: HelpActionId) => {
      const action = helpActions[actionId];
      if (!action) return;

      if (action.command === "openCreatePost") {
        const type = action.params?.type ?? null;
        const allowedTypes: PostType[] = ["offer", "hiring", "milestone", "question", "event", "update"];
        setCreateType(type && allowedTypes.includes(type as PostType) ? (type as PostType) : null);
        setCreateOpen(true);
        return;
      }

      if (action.command === "startProductTour") {
        startTour(PRODUCT_TOUR.id);
        return;
      }

      if (action.command === "openAssistant") {
        openAssistant();
        return;
      }

      if (action.command === "openChecklist") {
        showChecklistWidget();
        return;
      }

      const route = resolveActionRoute(action, me.id);
      if (route) {
        router.push(route);
      }
    },
    [router, me.id, setCreateOpen, setCreateType, startTour, openAssistant, showChecklistWidget]
  );

  const value = useMemo<HelpContextValue>(
    () => ({
      onboardingStatus,
      onboardingStep,
      onboardingGoals,
      experienceLevel,
      setExperienceLevel,
      saveOnboardingStep,
      finishOnboarding,
      skipOnboardingFlow,
      refreshOnboarding,

      checklistCompleted,
      checklistHidden,
      checklistAutoDetected,
      checklistProgress,
      completeTask,
      hideChecklistWidget,
      showChecklistWidget,
      refreshChecklist,

      activeTour,
      tourStepIndex,
      startTour,
      nextTourStep,
      prevTourStep,
      endTour,
      currentTourStep,

      assistantOpen,
      assistantMinimized,
      assistantMessages,
      assistantLoading,
      assistantUnreadCount,
      assistantLastError,
      openAssistant,
      closeAssistant,
      toggleAssistant,
      minimizeAssistant,
      sendAssistantQuery,
      retryLastQuery,
      sendAssistantFeedback,
      clearAssistantMessages,

      conversations,
      currentConversationId,
      conversationsLoading,
      startNewConversation,
      openConversation,
      renameConversationAction,
      deleteConversationAction,
      searchConversationsAction,
      conversationSearchResults,

      guidedModeActive,
      startGuidedMode,
      stopGuidedMode,

      assistantEnabled,
      productTipsEnabled,
      setAssistantEnabled,
      setProductTipsEnabled,

      currentRoute: pathname,
      executeAction,
    }),
    [
      onboardingStatus, onboardingStep, onboardingGoals, experienceLevel,
      setExperienceLevel, saveOnboardingStep, finishOnboarding, skipOnboardingFlow, refreshOnboarding,
      checklistCompleted, checklistHidden, checklistAutoDetected, checklistProgress,
      completeTask, hideChecklistWidget, showChecklistWidget, refreshChecklist,
      activeTour, tourStepIndex, startTour, nextTourStep, prevTourStep, endTour, currentTourStep,
      assistantOpen, assistantMinimized, assistantMessages, assistantLoading, assistantUnreadCount, assistantLastError,
      openAssistant, closeAssistant, toggleAssistant, minimizeAssistant,
      sendAssistantQuery, retryLastQuery, sendAssistantFeedback, clearAssistantMessages,
      conversations, currentConversationId, conversationsLoading,
      startNewConversation, openConversation, renameConversationAction, deleteConversationAction,
      searchConversationsAction, conversationSearchResults,
      guidedModeActive, startGuidedMode, stopGuidedMode,
      assistantEnabled, productTipsEnabled, setAssistantEnabled, setProductTipsEnabled,
      pathname, executeAction,
    ]
  );

  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>;
}

export function useHelp(): HelpContextValue {
  const ctx = useContext(HelpContext);
  if (!ctx) throw new Error("useHelp must be used within HelpProvider");
  return ctx;
}
