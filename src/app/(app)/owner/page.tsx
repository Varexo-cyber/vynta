import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getOwnerDashboardData } from "@/lib/platform-admin";
import { OwnerDashboardClient } from "./OwnerDashboardClient";

export default async function OwnerPage() {
  const session = await getSession();
  if (!session || (session.platformRole !== "admin" && session.platformRole !== "owner")) {
    redirect("/feed");
  }
  const data = await getOwnerDashboardData();
  return <OwnerDashboardClient data={data} />;
}
