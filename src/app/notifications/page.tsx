import AppShell, { requireMember } from "@/components/AppShell";
import { bvGet } from "@/lib/bvApi";
import NotificationsPageContent from "./NotificationsPageContent";

export default async function NotificationsPage() {
  const member = await requireMember();

  const { notifications } = await bvGet<{
    notifications: {
      id: string;
      projectId: string;
      message: string;
      isRead: boolean;
      type: string;
      createdAt: string;
      project: { projectName: string } | null;
    }[];
  }>("/notifications", member.id);

  const notificationData = notifications.map((notification) => ({
    id: notification.id,
    projectId: notification.projectId,
    projectName: notification.project?.projectName ?? null,
    message: notification.message,
    isRead: notification.isRead,
    type: notification.type,
    createdAt: notification.createdAt
  }));

  return (
    <AppShell>
      <NotificationsPageContent
        notifications={notificationData}
      />
    </AppShell>
  );
}