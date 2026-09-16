"use client";

import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/format";

export default function NotificationRow({
  notification
}: {
  notification: {
    id: string;
    projectId: string;
    message: string;
    isRead: boolean;
    type: string;
    createdAt: string;
  };
}) {
  const router = useRouter();

  async function open() {
    if (!notification.isRead) {
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notification.id })
      }).catch(() => {});
    }
    router.push(`/projects/${notification.projectId}`);
  }

  return (
    <button
      onClick={open}
      className={`flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-paper/60 ${
        notification.isRead ? "" : "bg-paper/40"
      }`}
    >
      <span
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor: notification.isRead ? "#C9CAD1" : notification.type === "VIDEO_APPROVED" ? "#2F7D5B" : "#B14A34"
        }}
      />
      <div>
        <p className={`text-sm ${notification.isRead ? "text-muted" : "font-medium text-ink"}`}>
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-muted">{timeAgo(new Date(notification.createdAt))}</p>
      </div>
    </button>
  );
}
