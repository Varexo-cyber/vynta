import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AssistantAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || (session.platformRole !== "admin" && session.platformRole !== "owner")) {
    redirect("/feed");
  }
  return children;
}
