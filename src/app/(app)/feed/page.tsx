import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getFeed } from "@/lib/queries";
import { cleanupExpiredPosts, notifyExpiringPosts } from "@/lib/actions";
import { FeedClient } from "./FeedClient";

export default async function FeedPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const [posts] = await Promise.all([
    getFeed(session.company.id),
    cleanupExpiredPosts().catch(() => 0),
    notifyExpiringPosts().catch(() => 0),
  ]);

  return <FeedClient posts={posts} />;
}
