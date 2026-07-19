import {
  getCompanyServices,
  getOpportunityDrafts,
  getOpportunityListing,
  getServiceCategories,
  type OpportunityListFilters,
  type OpportunityListSort,
  type OpportunityListTab,
} from "@/lib/opportunity-queries";
import type { OpportunityStatus, OpportunityType } from "@/lib/types";
import { OpportunitiesClient } from "./opportunities-client";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function value(params: Record<string, string | string[] | undefined>, key: string) {
  const entry = params[key];
  return Array.isArray(entry) ? entry[0] ?? "" : entry ?? "";
}

export default async function OpportunitiesPage({ searchParams }: { searchParams: SearchParams }) {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (!session) return null;
  const me = session.company;
  const query = await searchParams;
  const filters: OpportunityListFilters = {
    tab: value(query, "tab") as OpportunityListTab,
    query: value(query, "q"),
    type: value(query, "type") as OpportunityType,
    location: value(query, "location"),
    sector: value(query, "sector"),
    date: value(query, "date") as OpportunityListFilters["date"],
    status: value(query, "status") as OpportunityStatus | "closed",
    sort: value(query, "sort") as OpportunityListSort,
    page: Number(value(query, "page")) || 1,
    limit: 12,
  };

  const [initialListing, services, categories] = await Promise.all([
    getOpportunityListing(me.id, filters),
    getCompanyServices(me.id),
    getServiceCategories(),
  ]);
  const listing = initialListing.total > 0 && initialListing.page > initialListing.totalPages
    ? await getOpportunityListing(me.id, { ...filters, page: initialListing.totalPages })
    : initialListing;
  const activeTab = ["for_you", "new", "nearby", "sector", "saved", "mine"].includes(filters.tab ?? "")
    ? filters.tab as OpportunityListTab
    : "for_you";
  const drafts = activeTab === "mine" ? await getOpportunityDrafts(me.id) : [];

  return (
    <OpportunitiesClient
      listing={listing}
      filters={{ ...filters, tab: activeTab }}
      hasServices={services.some((service) => service.active)}
      categories={categories}
      drafts={drafts}
    />
  );
}
