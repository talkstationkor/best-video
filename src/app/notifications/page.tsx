import AppShell, { requireMember } from "@/components/AppShell";
import { prisma } from "@/lib/db";
import NotificationsPageContent from "./NotificationsPageContent";

export default async function NotificationsPage() {
  const member = await requireMember();

  const notifications = await prisma.notification.findMany({
    where: {
      recipientId: member.id
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 100,
    include: {
      project: {
        select: {
          projectName: true
        }
      }
    }
  });

  const notificationData = notifications.map((notification) => ({
    id: notification.id,
    projectId: notification.projectId,
    projectName: notification.project?.projectName ?? null,
    message: notification.message,
    isRead: notification.isRead,
    type: notification.type,
    createdAt: notification.createdAt.toISOString()
  }));

  return (
    <AppShell>
      <NotificationsPageContent
        notifications={notificationData}
      />
    </AppShell>
  );
}