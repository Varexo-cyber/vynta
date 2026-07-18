import { getOpportunityCards, getCompanyPreferences, getCompanyServices } from "@/lib/opportunity-queries";
import { OpportunitiesClient } from "./opportunities-client";

export default async function OpportunitiesPage() {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) return null;
  const me = session.company;

  const [cards, preferences, services] = await Promise.all([
    getOpportunityCards(me.id, { tab: "for_you" }),
    getCompanyPreferences(me.id),
    getCompanyServices(me.id),
  ]);

  return (
    <OpportunitiesClient
      initialCards={cards}
      preferences={preferences}
      hasServices={services.length > 0}
      companyId={me.id}
    />
  );
}
