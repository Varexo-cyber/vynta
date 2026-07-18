import { getServiceCategories } from "@/lib/opportunity-queries";
import { NewOpportunityClient } from "./new-client";

export default async function NewOpportunityPage() {
  const categories = await getServiceCategories();
  return <NewOpportunityClient categories={categories} />;
}
