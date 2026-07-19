import { redirect } from "next/navigation";
import { Landing } from "@/components/landing";

export default async function Home() {
  if (process.env.NODE_ENV === "development" && !process.env.DATABASE_URL) {
    return <Landing />;
  }

  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (session) redirect("/feed");
  return <Landing />;
}
