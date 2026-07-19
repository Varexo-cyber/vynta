import { getNetworks } from "@/lib/queries";
import { OnboardingClient } from "./OnboardingClient";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPendingGoogleProfile } from "@/lib/google-auth";

export default async function OnboardingPage() {
  const session = await getSession();
  if (session) redirect("/feed");
  const [networks, googleProfile] = await Promise.all([getNetworks(), getPendingGoogleProfile()]);
  return <OnboardingClient networks={networks} googleProfile={googleProfile} />;
}
