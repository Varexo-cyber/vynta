import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getFeed } from "@/lib/queries";
import { cleanupExpiredPosts, notifyExpiringPosts } from "@/lib/actions";
import { FeedClient } from "./FeedClient";

export default async function FeedPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  await cleanupExpiredPosts();
  const [posts] = await Promise.all([
    getFeed(session.company.id),
    notifyExpiringPosts().catch(() => 0),
  ]);

  return <FeedClient posts={posts} />;
}
