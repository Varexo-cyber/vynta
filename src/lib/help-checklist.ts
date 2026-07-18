import type { HelpActionId } from "./help-actions";

export interface ChecklistTask {
  id: string;
  label: string;
  actionId: HelpActionId;
  tourId?: string;
  autoDetect: boolean;
  detectKey?: string;
}

export const CHECKLIST_TASKS: ChecklistTask[] = [
  {
    id: "add-logo",
    label: "Bedrijfslogo toevoegen",
    actionId: "EDIT_COMPANY_LOGO",
    tourId: "edit-logo",
    autoDetect: true,
    detectKey: "hasLogo",
  },
  {
    id: "add-description",
    label: "Bedrijfsomschrijving invullen",
    actionId: "EDIT_COMPANY_DESCRIPTION",
    tourId: "edit-description",
    autoDetect: true,
    detectKey: "hasDescription",
  },
  {
    id: "check-contact",
    label: "Contactgegevens controleren",
    actionId: "EDIT_COMPANY_CONTACT",
    tourId: "edit-contact",
    autoDetect: true,
    detectKey: "hasContact",
  },
  {
    id: "join-municipality",
    label: "Deelnemen aan je gemeentelijke netwerk",
    actionId: "JOIN_NETWORK",
    tourId: "join-network",
    autoDetect: true,
    detectKey: "hasMunicipalityNetwork",
  },
  {
    id: "join-province",
    label: "Deelnemen aan je provinciale netwerk",
    actionId: "JOIN_NETWORK",
    tourId: "join-network",
    autoDetect: true,
    detectKey: "hasProvinceNetwork",
  },
  {
    id: "join-industry",
    label: "Deelnemen aan je branche",
    actionId: "JOIN_NETWORK",
    tourId: "join-network",
    autoDetect: true,
    detectKey: "hasIndustryNetwork",
  },
  {
    id: "first-post",
    label: "Eerste bericht plaatsen",
    actionId: "CREATE_POST",
    tourId: "first-post",
    autoDetect: true,
    detectKey: "hasPosted",
  },
  {
    id: "first-follow",
    label: "Eerste bedrijf volgen",
    actionId: "FOLLOW_COMPANY",
    tourId: "first-follow",
    autoDetect: true,
    detectKey: "hasFollowed",
  },
  {
    id: "first-conversation",
    label: "Eerste zakelijk gesprek starten",
    actionId: "START_CONVERSATION",
    tourId: "first-conversation",
    autoDetect: true,
    detectKey: "hasConversed",
  },
];

export const CHECKLIST_TOTAL = CHECKLIST_TASKS.length;

export function getChecklistProgress(
  completed: Set<string>,
  autoDetected: Record<string, boolean>
): { done: number; total: number; percentage: number } {
  const total = CHECKLIST_TOTAL;
  let done = 0;
  for (const task of CHECKLIST_TASKS) {
    if (completed.has(task.id) || (task.detectKey && autoDetected[task.detectKey])) {
      done++;
    }
  }
  return { done, total, percentage: Math.round((done / total) * 100) };
}
