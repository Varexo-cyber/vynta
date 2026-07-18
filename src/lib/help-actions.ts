export type HelpActionId =
  | "OPEN_FEED"
  | "OPEN_SEARCH"
  | "OPEN_NETWORKS"
  | "OPEN_MESSAGES"
  | "OPEN_NOTIFICATIONS"
  | "OPEN_SAVED"
  | "OPEN_SETTINGS"
  | "OPEN_COMPANY_PROFILE"
  | "EDIT_COMPANY_PROFILE"
  | "EDIT_COMPANY_LOGO"
  | "EDIT_COMPANY_DESCRIPTION"
  | "EDIT_COMPANY_CONTACT"
  | "CREATE_POST"
  | "CREATE_OFFER"
  | "CREATE_VACANCY"
  | "CREATE_QUESTION"
  | "CREATE_UPDATE"
  | "CREATE_EVENT"
  | "CREATE_MILESTONE"
  | "OPEN_DRAFTS"
  | "OPEN_HELP_CENTER"
  | "START_PRODUCT_TOUR"
  | "OPEN_ONBOARDING"
  | "OPEN_CHECKLIST"
  | "OPEN_ASSISTANT"
  | "JOIN_NETWORK"
  | "LEAVE_NETWORK"
  | "FOLLOW_COMPANY"
  | "START_CONVERSATION"
  | "OPEN_SAVED_POSTS"
  | "TOGGLE_THEME"
  | "SIGN_OUT";

export interface HelpAction {
  route?: string;
  label: string;
  command?: string;
  params?: Record<string, string>;
  tourId?: string;
  requiredPermission?: "company_member" | "company_admin" | "any";
  external?: boolean;
}

export const helpActions: Record<HelpActionId, HelpAction> = {
  OPEN_FEED: {
    route: "/feed",
    label: "Feed openen",
    requiredPermission: "any",
  },
  OPEN_SEARCH: {
    route: "/search",
    label: "Zoeken openen",
    requiredPermission: "any",
  },
  OPEN_NETWORKS: {
    route: "/networks",
    label: "Netwerken openen",
    requiredPermission: "any",
  },
  OPEN_MESSAGES: {
    route: "/messages",
    label: "Berichten openen",
    requiredPermission: "any",
  },
  OPEN_NOTIFICATIONS: {
    route: "/notifications",
    label: "Meldingen openen",
    requiredPermission: "any",
  },
  OPEN_SAVED: {
    route: "/saved",
    label: "Opgeslagen berichten openen",
    requiredPermission: "any",
  },
  OPEN_SETTINGS: {
    route: "/settings",
    label: "Instellingen openen",
    requiredPermission: "any",
  },
  OPEN_COMPANY_PROFILE: {
    route: "/company/{companyId}",
    label: "Bedrijfsprofiel openen",
    requiredPermission: "any",
  },
  EDIT_COMPANY_PROFILE: {
    route: "/settings",
    label: "Bedrijfsgegevens bewerken",
    command: "openCompanyEdit",
    requiredPermission: "company_member",
  },
  EDIT_COMPANY_LOGO: {
    route: "/settings",
    command: "openCompanyEdit",
    label: "Bedrijfslogo wijzigen",
    tourId: "company-logo-upload",
    requiredPermission: "company_member",
  },
  EDIT_COMPANY_DESCRIPTION: {
    route: "/settings",
    command: "openCompanyEdit",
    label: "Bedrijfsomschrijving invullen",
    requiredPermission: "company_member",
  },
  EDIT_COMPANY_CONTACT: {
    route: "/settings",
    command: "openCompanyEdit",
    label: "Contactgegevens controleren",
    requiredPermission: "company_member",
  },
  CREATE_POST: {
    route: "/feed",
    command: "openCreatePost",
    label: "Plaats bericht",
    requiredPermission: "any",
  },
  CREATE_OFFER: {
    route: "/feed",
    command: "openCreatePost",
    params: { type: "offer" },
    label: "Plaats aanbod",
    requiredPermission: "any",
  },
  CREATE_VACANCY: {
    route: "/feed",
    command: "openCreatePost",
    params: { type: "hiring" },
    label: "Plaats vacature",
    requiredPermission: "any",
  },
  CREATE_QUESTION: {
    route: "/feed",
    command: "openCreatePost",
    params: { type: "question" },
    label: "Plaats vraag",
    requiredPermission: "any",
  },
  CREATE_UPDATE: {
    route: "/feed",
    command: "openCreatePost",
    params: { type: "update" },
    label: "Plaats update",
    requiredPermission: "any",
  },
  CREATE_EVENT: {
    route: "/feed",
    command: "openCreatePost",
    params: { type: "event" },
    label: "Plaats evenement",
    requiredPermission: "any",
  },
  CREATE_MILESTONE: {
    route: "/feed",
    command: "openCreatePost",
    params: { type: "milestone" },
    label: "Plaats mijlpaal",
    requiredPermission: "any",
  },
  OPEN_DRAFTS: {
    route: "/drafts",
    label: "Concepten openen",
    requiredPermission: "any",
  },
  OPEN_HELP_CENTER: {
    route: "/help",
    label: "Helpcentrum openen",
    requiredPermission: "any",
  },
  START_PRODUCT_TOUR: {
    label: "Producttour starten",
    command: "startProductTour",
    requiredPermission: "any",
  },
  OPEN_ONBOARDING: {
    route: "/onboarding",
    label: "Onboarding heropenen",
    requiredPermission: "any",
  },
  OPEN_CHECKLIST: {
    label: "Aan-de-slag checklist openen",
    command: "openChecklist",
    requiredPermission: "any",
  },
  OPEN_ASSISTANT: {
    label: "Vynta Assistent openen",
    command: "openAssistant",
    requiredPermission: "any",
  },
  JOIN_NETWORK: {
    route: "/networks",
    label: "Deelnemen aan netwerk",
    requiredPermission: "any",
  },
  LEAVE_NETWORK: {
    route: "/networks",
    label: "Netwerk verlaten",
    requiredPermission: "any",
  },
  FOLLOW_COMPANY: {
    label: "Bedrijf volgen",
    requiredPermission: "any",
  },
  START_CONVERSATION: {
    route: "/messages",
    label: "Gesprek starten",
    requiredPermission: "any",
  },
  OPEN_SAVED_POSTS: {
    route: "/saved",
    label: "Opgeslagen berichten bekijken",
    requiredPermission: "any",
  },
  TOGGLE_THEME: {
    label: "Thema wisselen",
    command: "toggleTheme",
    requiredPermission: "any",
  },
  SIGN_OUT: {
    label: "Uitloggen",
    command: "signOut",
    requiredPermission: "any",
  },
};

export function getHelpAction(id: HelpActionId): HelpAction | undefined {
  return helpActions[id];
}

export function resolveActionRoute(action: HelpAction, companyId?: string): string | undefined {
  if (!action.route) return undefined;
  if (action.route.includes("{companyId}")) {
    if (!companyId) return undefined;
    return action.route.replace("{companyId}", companyId);
  }
  return action.route;
}

export const allActionIds = Object.keys(helpActions) as HelpActionId[];
