import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { HelpCenterClient } from "@/components/help/help-center-client";

export default async function HelpPage() {
  const session = await getSession();
  if (!session) redirect("/auth");
  return <HelpCenterClient />;
}
