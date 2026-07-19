import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOpportunityListing, type OpportunityListFilters } from "@/lib/opportunity-queries";
import type { OpportunityStatus, OpportunityType } from "@/lib/types";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const filters: OpportunityListFilters = {
    tab: (params.get("tab") ?? "for_you") as OpportunityListFilters["tab"],
    query: params.get("q") ?? "",
    type: (params.get("type") ?? "") as OpportunityType,
    location: params.get("location") ?? "",
    sector: params.get("sector") ?? "",
    date: (params.get("date") ?? "") as OpportunityListFilters["date"],
    status: (params.get("status") ?? "") as OpportunityStatus | "closed",
    sort: (params.get("sort") ?? "relevant") as OpportunityListFilters["sort"],
    page: Number(params.get("page")) || 1,
    limit: Number(params.get("limit")) || 12,
  };
  try {
    const listing = await getOpportunityListing(session.company.id, filters);
    return NextResponse.json({ ok: true, ...listing });
  } catch {
    return NextResponse.json({ ok: false, error: "Kansen konden niet worden geladen." }, { status: 500 });
  }
}
