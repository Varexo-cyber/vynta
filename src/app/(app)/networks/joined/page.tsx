import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Globe } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getNetworksByCompany } from "@/lib/queries";
import { networkIcon } from "@/lib/network-icon";

export default async function JoinedNetworksPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const networks = await getNetworksByCompany(session.company.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/feed"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} /> Terug
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Jouw netwerken</h1>
      {networks.length === 0 ? (
        <p className="text-muted">Je bent nog geen lid van een netwerk.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {networks.map((n) => {
            const Icon = networkIcon(n.name, n.type);
            return (
              <Link
                key={n.id}
                href={`/networks/${n.id}`}
                className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all hover:bg-surface-2 hover:shadow-md"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">
                  <Icon size={24} strokeWidth={1.6} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{n.name}</p>
                  <p className="text-sm text-muted">
                    {n.type === "municipality"
                      ? "Gemeente"
                      : n.type === "province"
                        ? "Provincie"
                        : n.type === "industry"
                          ? "Branche"
                          : "Landelijk"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
