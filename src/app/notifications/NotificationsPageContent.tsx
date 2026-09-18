"use client";

import MarkAllReadButton from "@/components/MarkAllReadButton";
import NotificationRow, {
  type NotificationData
} from "@/components/NotificationRow";

import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";

type Props = {
  notifications?: NotificationData[];
};

export default function NotificationsPageContent({
  notifications = []
}: Props) {
  const { language } = useLanguage();

  const t =
    language === "English"
      ? translations.English
      : translations.Korean;

  const hasUnread = notifications.some(
    (notification) => !notification.isRead
  );

  const isEnglish = language === "English";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">
          {isEnglish ? "Notifications" : "알림"}
        </h1>

        {hasUnread && <MarkAllReadButton />}
      </div>

      <div className="mt-6">
        {notifications.length === 0 ? (
          <div className="card px-6 py-14 text-center">
            <p className="font-medium text-ink">
              {isEnglish
                ? "You're all caught up."
                : "모든 알림을 확인했습니다."}
            </p>

            <p className="mt-2 text-sm text-muted">
              {isEnglish
                ? "No new notifications."
                : "새로운 알림이 없습니다."}
            </p>
          </div>
        ) : (
          <div className="card divide-y divide-line">
            {notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}