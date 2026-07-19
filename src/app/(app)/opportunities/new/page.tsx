import { getOpportunityDraftById, getServiceCategories } from "@/lib/opportunity-queries";
import { getSession } from "@/lib/auth";
import { NewOpportunityClient } from "./new-client";

export default async function NewOpportunityPage({ searchParams }: { searchParams: Promise<{ draft?: string | string[] }> }) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;
  const draftId = Array.isArray(params.draft) ? params.draft[0] : params.draft;
  const [categories, draft] = await Promise.all([
    getServiceCategories(),
    draftId ? getOpportunityDraftById(draftId, session.company.id) : Promise.resolve(null),
  ]);
  return <NewOpportunityClient categories={categories} initialDraft={draft} />;
}
