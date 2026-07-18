import { getServiceCategories, getCompanyServices, getCompanyServiceAreas, getCompanyPreferences } from "@/lib/opportunity-queries";
import { getSession } from "@/lib/auth";
import { OpportunitySettings } from "@/components/opportunity-settings";

export async function OpportunitySettingsServer() {
  const session = await getSession();
  if (!session) return null;

  const [categories, services, serviceAreas, preferences] = await Promise.all([
    getServiceCategories(),
    getCompanyServices(session.company.id),
    getCompanyServiceAreas(session.company.id),
    getCompanyPreferences(session.company.id),
  ]);

  return (
    <OpportunitySettings
      categories={categories}
      services={services}
      serviceAreas={serviceAreas}
      preferences={preferences}
    />
  );
}
