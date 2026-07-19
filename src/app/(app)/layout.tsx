import { redirect } from "next/navigation";
import { AppProvider } from "@/components/app-store";
import { AppShell } from "@/components/app-shell";
import { HelpProvider } from "@/components/help/help-provider";
import { getSession } from "@/lib/auth";
import {
  getCompaniesMap,
  getNetworks,
  getNetworksByCompany,
  getFollowingIds,
  getFollowedNetworkIds,
  getUnreadMessageCount,
  getUnreadNotificationCount,
} from "@/lib/queries";
import { getNewMatchCount } from "@/lib/opportunity-queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth");
  const me = session.company;

  const [companies, networks, myNetworks, followingIds, followedNetworkIds, unreadMessages, unreadNotifications, unreadOpportunities] =
    await Promise.all([
      getCompaniesMap(),
      getNetworks(),
      getNetworksByCompany(me.id),
      getFollowingIds(me.id),
      getFollowedNetworkIds(me.id),
      getUnreadMessageCount(me.id),
      getUnreadNotificationCount(me.id),
      getNewMatchCount(me.id),
    ]);

  companies[me.id] = me;

  return (
    <AppProvider
      me={me}
      platformRole={session.platformRole}
      companies={companies}
      myNetworks={myNetworks}
      networks={networks}
      followingIds={followingIds}
      followedNetworkIds={followedNetworkIds}
      unreadMessages={unreadMessages}
      unreadNotifications={unreadNotifications}
      unreadOpportunities={unreadOpportunities}
    >
      <HelpProvider>
        <AppShell>{children}</AppShell>
      </HelpProvider>
    </AppProvider>
  );
}
