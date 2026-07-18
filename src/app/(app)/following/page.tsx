import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserCheck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getFollowedCompanies } from "@/lib/queries";
import { CompanyAvatar } from "@/components/ui/primitives";

export default async function FollowingPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const companies = await getFollowedCompanies(session.company.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/feed"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> Terug
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Bedrijven die je volgt</h1>
      {companies.length === 0 ? (
        <p className="text-muted">Je volgt nog geen bedrijven.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {companies.map((c) => (
            <Link
              key={c.id}
              href={`/company/${c.id}`}
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all hover:bg-surface-2 hover:shadow-md"
            >
              <CompanyAvatar
                name={c.name}
                color={c.logoColor}
                logoUrl={c.logoUrl}
                website={c.website}
                size={56}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{c.name}</p>
                <p className="text-sm text-muted">
                  {c.industry} · {c.city}
                </p>
              </div>
              <UserCheck size={18} className="text-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
