import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { runMatchingForOpportunity, runExpansionRound } from "@/lib/opportunity-matching";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { opportunityId, action } = body as { opportunityId?: string; action?: "initial" | "expand" };

  if (!opportunityId) {
    return NextResponse.json({ ok: false, error: "opportunityId required" }, { status: 400 });
  }

  // Verify ownership
  const rows = await sql`SELECT company_id FROM opportunities WHERE id = ${opportunityId} LIMIT 1`;
  if (rows.length === 0) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  if (rows[0].company_id !== session.company.id) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    if (action === "expand") {
      const result = await runExpansionRound(opportunityId);
      return NextResponse.json({ ok: true, ...result });
    }
    const result = await runMatchingForOpportunity(opportunityId, 1, { minScore: 30, maxResults: 20 });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Matching failed" }, { status: 500 });
  }
}
