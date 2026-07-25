import { OnboardingClient } from "./OnboardingClient";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  if (process.env.NODE_ENV === "development" && !process.env.DATABASE_URL) {
    return <OnboardingClient networks={[]} googleProfile={null} />;
  }

  const [{ getNetworks }, { getSession }, { getPendingGoogleProfile }] = await Promise.all([
    import("@/lib/queries"),
    import("@/lib/auth"),
    import("@/lib/google-auth"),
  ]);
  const session = await getSession();
  if (session) redirect("/feed");
  const [networks, googleProfile] = await Promise.all([getNetworks(), getPendingGoogleProfile()]);
  return <OnboardingClient networks={networks} googleProfile={googleProfile} />;
}
