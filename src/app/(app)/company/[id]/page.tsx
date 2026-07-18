import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCompanyById, getPostsByCompany, getFollowingIds } from "@/lib/queries";
import { CompanyProfileClient } from "./CompanyProfileClient";

export default async function CompanyProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/auth");

  const company = await getCompanyById(id);
  if (!company) return notFound();

  const [posts, followingIds] = await Promise.all([
    getPostsByCompany(id, session.company.id),
    getFollowingIds(session.company.id),
  ]);

  return (
    <CompanyProfileClient
      company={company}
      posts={posts}
      followingInitial={followingIds.includes(id)}
    />
  );
}
