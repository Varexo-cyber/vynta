import { getNetworks } from "@/lib/queries";
import { OnboardingClient } from "./OnboardingClient";

export default async function OnboardingPage() {
  const networks = await getNetworks();
  return <OnboardingClient networks={networks} />;
}
