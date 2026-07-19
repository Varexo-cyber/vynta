import { getNetworks } from "@/lib/queries";
import { OnboardingClient } from "./OnboardingClient";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const session = await getSession();
  if (session) redirect("/feed");
  const networks = await getNetworks();
  return <OnboardingClient networks={networks} />;
}
