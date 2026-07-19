import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getOpportunityById, getServiceCategories } from "@/lib/opportunity-queries";
import { EditOpportunityClient } from "../../new/new-client";

export default async function EditOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;
  const [opportunity, categories] = await Promise.all([
    getOpportunityById(id),
    getServiceCategories(),
  ]);
  if (!opportunity || opportunity.companyId !== session.company.id) notFound();
  return <EditOpportunityClient categories={categories} opportunity={opportunity} />;
}
