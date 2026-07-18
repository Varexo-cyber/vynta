import { notFound } from "next/navigation";
import { getOpportunityById, getResponsesForOpportunity, getCategoryPath, getMatchesForOpportunity, getDistributionRounds } from "@/lib/opportunity-queries";
import { getSession } from "@/lib/auth";
import { OpportunityDetailClient } from "./detail-client";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const opportunity = await getOpportunityById(id);
  if (!opportunity) notFound();

  const isOwner = opportunity.companyId === session.company.id;

  const [responses, categoryPath, matches, rounds] = await Promise.all([
    getResponsesForOpportunity(id),
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
    />
  );
}
