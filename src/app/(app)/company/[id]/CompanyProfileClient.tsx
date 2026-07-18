"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PostCard } from "@/components/need-card";
import { CompanyProfileHeader } from "@/components/company-profile-header";
import type { Company, Post } from "@/lib/types";

export function CompanyProfileClient({
  company,
  posts,
  followingInitial,
}: {
  company: Company;
  posts: Post[];
  followingInitial: boolean;
}) {
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-32 pt-5 lg:pt-10">
      <CompanyProfileHeader
        company={company}
        postsCount={posts.length}
        followingInitial={followingInitial}
      />

      {company.products.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Producten & Diensten
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {company.products.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-border-strong">
                <p className="font-semibold">{p.name}</p>
                <p className="mt-0.5 text-sm text-muted">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-4 mt-8 text-xl font-bold tracking-tight">Posts</h2>
      <div className="flex flex-col">
        {posts.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted">
            Geen posts van dit bedrijf.
          </div>
        ) : (
          posts.map((post, i) => (
            <div key={post.id} className="border-t border-border first:border-t-0">
              <PostCard post={post} index={i} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
