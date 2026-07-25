import { redirect } from "next/navigation";
import { PublicEntry } from "@/components/public-entry";

export default async function Home() {
  if (process.env.NODE_ENV === "development" && !process.env.DATABASE_URL) {
    return <PublicEntry />;
  }

  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (session) redirect("/feed");
  return <PublicEntry />;
}
