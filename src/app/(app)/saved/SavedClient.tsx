"use client";

import { Bookmark, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PostCard } from "@/components/need-card";
import type { Post } from "@/lib/types";

export function SavedClient({ posts }: { posts: Post[] }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/feed"
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft size={18} /> Terug naar feed
      </Link>
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Bookmark size={26} className="text-foreground" />
        Opgeslagen berichten
      </h1>
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <Bookmark size={40} className="mx-auto mb-3 text-muted" />
          <p className="text-muted">Je hebt nog geen berichten opgeslagen.</p>
          <p className="mt-1 text-sm text-muted">Klik bij een post op Opslaan om hem hier terug te vinden.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {posts.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
