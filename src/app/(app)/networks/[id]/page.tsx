import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getNetworkById, getPostsByNetwork, getCompanyNetworks, getFollowedNetworkIds } from "@/lib/queries";
import { NetworkDetailClient } from "./NetworkDetailClient";

export default async function NetworkDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/auth");

  const network = await getNetworkById(id);
  if (!network) return notFound();

  const posts = await getPostsByNetwork(id, session.company.id);
  const [connectedIds, followedIds] = await Promise.all([
    getCompanyNetworks(session.company.id),
    getFollowedNetworkIds(session.company.id),
  ]);

  return (
    <NetworkDetailClient
      network={network}
      posts={posts}
      connected={connectedIds.includes(id)}
      followedInitial={followedIds.includes(id)}
    />
  );
}
