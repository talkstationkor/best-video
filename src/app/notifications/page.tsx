import AppShell, { requireMember } from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import MarkAllReadButton from "@/components/MarkAllReadButton";
import NotificationRow from "@/components/NotificationRow";
import { prisma } from "@/lib/db";

export default async function NotificationsPage() {
  const member = await requireMember();

  const notifications = await prisma.notification.findMany({
    where: { recipientId: member.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { project: { select: { projectName: true } } }
  });

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Notifications</h1>
        {hasUnread && <MarkAllReadButton />}
      </div>

      <div className="mt-6">
        {notifications.length === 0 ? (
          <EmptyState title="You're all caught up." description="No new notifications." />
        ) : (
          <div className="card divide-y divide-line">
            {notifications.map((n) => (
              <NotificationRow
                key={n.id}
                notification={{
                  id: n.id,
                  projectId: n.projectId,
                  message: n.message,
                  isRead: n.isRead,
                  type: n.type,
                  createdAt: n.createdAt.toISOString()
                }}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
