import { notFound } from "next/navigation";
import { getOpportunityAccess, getOpportunityById, getResponsesForOpportunity, getCategoryPath, getMatchesForOpportunity, getDistributionRounds } from "@/lib/opportunity-queries";
import { getSession } from "@/lib/auth";
import { OpportunityDetailClient } from "./detail-client";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const [opportunity, access] = await Promise.all([
    getOpportunityById(id),
    getOpportunityAccess(id, session.company.id),
  ]);
  if (!opportunity) notFound();
  if (!access.canView) notFound();

  const isOwner = access.isOwner;

  const [responses, categoryPath, matches, rounds] = await Promise.all([
    getResponsesForOpportunity(id, session.company.id, isOwner),
    opportunity.categoryId ? getCategoryPath(opportunity.categoryId) : Promise.resolve(""),
    isOwner ? getMatchesForOpportunity(id) : Promise.resolve([]),
    isOwner ? getDistributionRounds(id) : Promise.resolve([]),
  ]);

  return (
    <OpportunityDetailClient
      opportunity={opportunity}
      responses={responses}
      categoryPath={categoryPath}
      isOwner={isOwner}
      myCompanyId={session.company.id}
      matches={matches}
      rounds={rounds}
      initiallySaved={access.saved}
      deadlineExpired={access.deadlineExpired}
    />
  );
}
