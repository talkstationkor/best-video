"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { timeAgo } from "@/lib/format";

export type NotificationData = {
  id: string;
  projectId: string | null;
  projectName: string | null;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
};

export default function NotificationRow({
  notification
}: {
  notification: NotificationData;
}) {
  const router = useRouter();
  const { language } = useLanguage();

  const isEnglish = language === "English";

  async function open() {
    if (!notification.isRead) {
      fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: notification.id
        })
      }).catch(() => {});
    }

    if (notification.projectId) {
      router.push(`/projects/${notification.projectId}`);
    }
  }

  /*
   * 기존 DB에 저장된 message에서
   * 사람 이름과 버전 번호를 가져옵니다.
   *
   * 예:
   * "John submitted V2 for "My Project""
   * "John approved V2. The project is now waiting for team review."
   */
  let actorName = "";
  let versionNumber = "";

  const versionMatch = notification.message.match(/V(\d+)/);

  if (versionMatch) {
    versionNumber = `V${versionMatch[1]}`;
  }

  if (
    notification.type === "PROJECT_CREATED" ||
    notification.type === "VERSION_SUBMITTED" ||
    notification.type === "FINAL_APPROVED"
  ) {
    const nameMatch = notification.message.match(/^(.+?)\s+(?:created|submitted|gave)/);

    if (nameMatch) {
      actorName = nameMatch[1];
    }
  }

  if (notification.type === "VIDEO_APPROVED") {
    const nameMatch = notification.message.match(/^(.+?)\s+approved/);

    if (nameMatch) {
      actorName = nameMatch[1];
    }
  }

  let message = notification.message;

  if (notification.type === "PROJECT_CREATED") {
    message = isEnglish
      ? `${actorName} created "${notification.projectName ?? "this project"}" (V1) — review required`
      : `${actorName}님이 "${notification.projectName ?? "이 프로젝트"}"를 생성했습니다 (V1) — 검수가 필요합니다`;
  }

  if (notification.type === "VERSION_SUBMITTED") {
    message = isEnglish
      ? `${actorName} submitted ${versionNumber} for "${notification.projectName ?? "this project"}"`
      : `${actorName}님이 "${notification.projectName ?? "이 프로젝트"}"에 ${versionNumber}을 제출했습니다`;
  }

  if (notification.type === "VIDEO_APPROVED") {
    message = isEnglish
      ? `${actorName} approved ${versionNumber}. The project is now waiting for team review.`
      : `${actorName}님이 ${versionNumber}을 승인했습니다. 이제 팀 검수를 기다리고 있습니다.`;
  }

  if (notification.type === "FINAL_APPROVED") {
    message = isEnglish
      ? `${actorName} gave final approval to ${versionNumber} of "${notification.projectName ?? "this project"}"`
      : `${actorName}님이 "${notification.projectName ?? "이 프로젝트"}"의 ${versionNumber}을 최종 승인했습니다`;
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={!notification.projectId}
      className={`flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-paper/60 ${
        notification.isRead
          ? ""
          : "bg-paper/40"
      } ${
        !notification.projectId
          ? "cursor-default"
          : ""
      }`}
    >
      <span
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{
          backgroundColor: notification.isRead
            ? "#C9CAD1"
            : notification.type === "VIDEO_APPROVED"
              ? "#2F7D5B"
              : "#B14A34"
        }}
      />

      <div className="min-w-0">
        <p
          className={`text-sm ${
            notification.isRead
              ? "text-muted"
              : "font-medium text-ink"
          }`}
        >
          {message}
        </p>

        <p className="mt-1 text-xs text-muted">
          {timeAgo(new Date(notification.createdAt))}
        </p>
      </div>
    </button>
  );
}