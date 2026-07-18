import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOpportunityCards } from "@/lib/opportunity-queries";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const tab = req.nextUrl.searchParams.get("tab") ?? "for_you";
  const cards = await getOpportunityCards(session.company.id, { tab });
  return NextResponse.json({ ok: true, cards });
}
