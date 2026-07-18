import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSavedPosts } from "@/lib/queries";
import { SavedClient } from "./SavedClient";

export default async function SavedPage() {
  const session = await getSession();
  if (!session) redirect("/auth");
  const posts = await getSavedPosts(session.company.id);
  return <SavedClient posts={posts} />;
}
