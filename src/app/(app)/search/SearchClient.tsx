"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search as SearchIcon, MapPin, MessageCircle } from "lucide-react";
import { useApp } from "@/components/app-store";
import { PostCard } from "@/components/need-card";
import { CompanyAvatar, VerifiedBadge, Pill } from "@/components/ui/primitives";
import type { Post } from "@/lib/types";

const TRENDING = ["Verpakkingen", "Olijfolie", "Vrachtcapaciteit", "CNC-verspaning", "Investeerders"];

export function SearchClient({ posts }: { posts: Post[] }) {
  const { companies, companyById } = useApp();
  const searchParams = useSearchParams();
  const companyList = useMemo(() => Object.values(companies), [companies]);
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"companies" | "posts">("companies");
  const startingConversation = searchParams.get("intent") === "message";

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
    <div className="search-page mx-auto w-full max-w-4xl px-4 pb-32 pt-5 lg:pt-10">
      <div className="mb-6 border-b border-border pb-5"><p className="vynta-kicker">Vind wat je bedrijf nodig heeft</p><h1 className="search-page-heading mt-2 text-3xl font-bold tracking-tight">Ontdekken</h1></div>

      {startingConversation && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-foreground">
            <MessageCircle size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">Met wie wil je in gesprek?</p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted">
              Zoek een bedrijf, open het profiel en kies Bericht.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-3.5 focus-within:border-border-strong">
        <SearchIcon size={20} className="text-muted" />
        <input
          autoFocus
          data-tour-id="search-query"
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

      <div className="mt-6 flex gap-1 border-b border-border bg-transparent p-0">
        {(["companies", "posts"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 border-b-2 px-3 py-3 text-sm font-semibold transition-colors press ${
              mode === m ? "border-brand text-foreground" : "border-transparent text-muted hover:text-foreground"
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
              data-tour-id="company-result"
              className="flex items-center gap-4 border-t border-border py-4 transition-colors first:border-t-0 hover:bg-surface-2/50"
            >
              <CompanyAvatar name={c.name} color={c.logoColor} logoUrl={c.logoUrl} website={c.website} size={56} />
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
