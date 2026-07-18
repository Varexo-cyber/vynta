import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getFeed } from "@/lib/queries";
import { SearchClient } from "./SearchClient";

export default async function SearchPage() {
  const session = await getSession();
  if (!session) redirect("/auth");
  const posts = await getFeed(session.company.id);
  return <SearchClient posts={posts} />;
}
