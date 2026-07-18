import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getNotifications } from "@/lib/queries";
import { NotificationsClient } from "./NotificationsClient";

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/auth");
  const notifications = await getNotifications(session.company.id);
  return <NotificationsClient notifications={notifications} />;
}
