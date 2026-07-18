"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, MapPin } from "lucide-react";
import { useApp } from "@/components/app-store";
import { PostCard } from "@/components/need-card";
import { CompanyAvatar, VerifiedBadge, Pill } from "@/components/ui/primitives";
import type { Post } from "@/lib/types";

const TRENDING = ["Verpakkingen", "Olijfolie", "Vrachtcapaciteit", "CNC-verspaning", "Investeerders"];

export function SearchClient({ posts }: { posts: Post[] }) {
  const { companies, companyById } = useApp();
  const companyList = useMemo(() => Object.values(companies), [companies]);
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"companies" | "posts">("companies");

  const query = q.trim().toLowerCase();

  const companyResults = useMemo(() => {
    if (!query) return companyList;
    return companyList.filter((c) =>
      [c.name, c.industry, c.country, c.city, c.description]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [query, companyList]);

  const postResults = useMemo(() => {
    if (!query) return posts;
    return posts.filter((n) => {
      const c = companyById(n.companyId);
      return [n.body, n.type, c?.name, c?.industry].join(" ").toLowerCase().includes(query);
    });
  }, [query, posts, companyById]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-32 pt-5 lg:pt-10">
      <h1 className="mb-5 text-3xl font-bold tracking-tight">Zoeken</h1>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 focus-within:border-border-strong">
        <SearchIcon size={20} className="text-muted" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Bedrijven, producten, sectoren, plaatsen…"
          className="w-full bg-transparent text-[17px] outline-none placeholder:text-muted"
        />
      </div>

      {!query && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Populair</p>
          <div className="flex flex-wrap gap-2">
            {TRENDING.map((t) => (
              <Pill key={t} onClick={() => setQ(t)}>{t}</Pill>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-1 rounded-full bg-surface-2/70 p-1">
        {(["companies", "posts"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all press ${
              mode === m ? "bg-foreground text-background" : "text-muted hover:text-foreground"
            }`}
          >
            {m === "companies" ? "Bedrijven" : "Posts"} · {m === "companies" ? companyResults.length : postResults.length}
          </button>
        ))}
      </div>

      {mode === "companies" ? (
        <div className="mt-5 flex flex-col">
          {companyResults.map((c) => (
            <Link
              key={c.id}
              href={`/company/${c.id}`}
              className="flex items-center gap-4 border-t border-border py-4 transition-colors first:border-t-0 hover:bg-surface-2/50"
            >
              <CompanyAvatar name={c.name} color={c.logoColor} size={56} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-base font-semibold">{c.name}</span>
                  {c.verified && <VerifiedBadge />}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                  <MapPin size={13} /> {c.city}{c.country && `, ${c.country}`} · {c.industry}
                </div>
              </div>
            </Link>
          ))}
          {companyResults.length === 0 && <Empty />}
        </div>
      ) : (
        <div className="flex flex-col">
          {postResults.map((post, i) => (
            <div key={post.id} className="border-t border-border first:border-t-0">
              <PostCard post={post} index={i} />
            </div>
          ))}
          {postResults.length === 0 && <Empty />}
        </div>
      )}
    </div>
  );
}

function Empty() {
  return (
    <div className="py-16 text-center">
      <p className="text-lg font-semibold">Geen resultaten</p>
      <p className="mt-1 text-sm text-muted">Probeer een andere term.</p>
    </div>
  );
}
