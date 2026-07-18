"use client";

import { useMemo } from "react";
import { ArrowRight, FileText, Image, MessageSquare, Users } from "lucide-react";
import { useHelp } from "@/components/help/help-provider";
import { useApp } from "@/components/app-store";
import { helpActions, type HelpActionId } from "@/lib/help-actions";

export function PersonalRecommendation() {
  const { me, myNetworks } = useApp();
  const {
    onboardingStatus,
    onboardingGoals,
    checklistAutoDetected,
    checklistCompleted,
    productTipsEnabled,
    executeAction,
  } = useHelp();

  const recommendation = useMemo<{
    text: string;
    actionId: HelpActionId;
    icon: React.ComponentType<{ size?: number }>;
  } | null>(() => {
    if (!productTipsEnabled) return null;

    if (onboardingStatus === "pending" || onboardingStatus === "in_progress") {
      return {
        text: "Voltooi je onboarding om je bedrijfsnetwerk goed in te stellen.",
        actionId: "OPEN_ONBOARDING",
        icon: FileText,
      };
    }

    if (!checklistAutoDetected.hasDescription && !checklistCompleted.has("add-description")) {
      return {
        text: "Je bedrijfsomschrijving ontbreekt nog. Een compleet profiel wekt meer vertrouwen.",
        actionId: "EDIT_COMPANY_DESCRIPTION",
        icon: FileText,
      };
    }

    if (!checklistAutoDetected.hasLogo && !checklistCompleted.has("add-logo")) {
      return {
        text: "Voeg een bedrijfslogo toe zodat andere bedrijven je sneller herkennen.",
        actionId: "EDIT_COMPANY_LOGO",
        icon: Image,
      };
    }

    if (!checklistAutoDetected.hasIndustryNetwork && !checklistCompleted.has("join-industry")) {
      return {
        text: `Deelnemen aan je branche netwerk helpt je bedrijven in ${me.industry} te vinden.`,
        actionId: "JOIN_NETWORK",
        icon: Users,
      };
    }

    if (!checklistAutoDetected.hasPosted && !checklistCompleted.has("first-post")) {
      const goalBased = onboardingGoals.length > 0
        ? getGoalRecommendation(onboardingGoals, me.industry)
        : null;
      if (goalBased) return goalBased;
      return {
        text: "Plaats je eerste bericht en bereik bedrijven in jouw branche.",
        actionId: "CREATE_POST",
        icon: FileText,
      };
    }

    if (!checklistAutoDetected.hasFollowed && !checklistCompleted.has("first-follow")) {
      return {
        text: "Volg je eerste bedrijf om relevante updates in je feed te zien.",
        actionId: "OPEN_SEARCH",
        icon: Users,
      };
    }

    if (!checklistAutoDetected.hasConversed && !checklistCompleted.has("first-conversation")) {
      return {
        text: "Start je eerste zakelijke gesprek met een bedrijf uit je netwerk.",
        actionId: "START_CONVERSATION",
        icon: MessageSquare,
      };
    }

    return null;
  }, [productTipsEnabled, onboardingStatus, checklistAutoDetected, checklistCompleted, onboardingGoals, me.industry]);

  if (!recommendation) return null;

  const action = helpActions[recommendation.actionId];
  if (!action) return null;

  const Icon = recommendation.icon;

  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">{recommendation.text}</p>
      </div>
      <button
        onClick={() => executeAction(recommendation.actionId)}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-foreground px-3 py-2 text-xs font-semibold text-background transition-all hover:opacity-90 press"
      >
        Aan de slag
        <ArrowRight size={14} />
      </button>
    </div>
  );
}

function getGoalRecommendation(
  goals: string[],
  industry: string
): { text: string; actionId: HelpActionId; icon: React.ComponentType<{ size?: number }> } | null {
  if (goals.includes("Nieuwe klanten vinden") || goals.includes("Mijn bedrijf zichtbaarder maken")) {
    return {
      text: `Plaats je eerste aanbod en bereik bedrijven in jouw branche.`,
      actionId: "CREATE_OFFER",
      icon: FileText,
    };
  }
  if (goals.includes("Leveranciers vinden")) {
    return {
      text: "Plaats een vraag om de juiste leverancier te vinden in je netwerk.",
      actionId: "CREATE_QUESTION",
      icon: FileText,
    };
  }
  if (goals.includes("Vacatures plaatsen")) {
    return {
      text: "Plaats je eerste vacature en bereik kandidaten in je netwerk.",
      actionId: "CREATE_VACANCY",
      icon: FileText,
    };
  }
  if (goals.includes("Samenwerkingen vinden")) {
    return {
      text: "Plaats een bericht om samenwerkingen te vinden in je branche.",
      actionId: "CREATE_POST",
      icon: FileText,
    };
  }
  if (goals.includes("Bedrijven in mijn gemeente leren kennen")) {
    return {
      text: "Verken bedrijven in jouw gemeente via het gemeentenetwerk.",
      actionId: "OPEN_NETWORKS",
      icon: Users,
    };
  }
  return null;
}
