import { getServiceCategories, getCompanyServices, getCompanyServiceAreas, getCompanyPreferences } from "@/lib/opportunity-queries";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OpportunitySettings } from "@/components/opportunity-settings";
import Link from "next/link";

export default async function OpportunitySettingsPage() {
  const session = await getSession();
  if (!session) redirect("/auth");

  const [categories, services, serviceAreas, preferences] = await Promise.all([
    getServiceCategories(),
    getCompanyServices(session.company.id),
    getCompanyServiceAreas(session.company.id),
    getCompanyPreferences(session.company.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/settings"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        ← Terug naar instellingen
      </Link>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Kansen instellingen</h1>
      <p className="mb-6 text-sm text-muted">
        Beheer je diensten, werkgebied en voorkeuren om relevante kansen te ontvangen.
      </p>
      <OpportunitySettings
        categories={categories}
        services={services}
        serviceAreas={serviceAreas}
        preferences={preferences}
      />
    </div>
  );
}
