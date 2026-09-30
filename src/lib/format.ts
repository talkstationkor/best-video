export function timeAgo(date: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function greetingFor(hour: number, english = true): string {
  if (hour < 12) return english ? "Good morning" : "좋은 아침입니다";
  if (hour < 18) return english ? "Good afternoon" : "안녕하세요";
  return english ? "Good evening" : "좋은 저녁입니다";
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function formatShortDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  REVIEW_REQUIRED: "Review Required",
  REVISION_REQUESTED: "Revision Requested",
  APPROVED: "Approved"
};

export const ACTION_LABEL: Record<string, string> = {
  PROJECT_CREATED: "created a project",
  VERSION_SUBMITTED: "submitted a new version",
  FEEDBACK_ADDED: "added feedback",
  FEEDBACK_RESOLVED: "resolved feedback",
  FEEDBACK_EDITED: "edited feedback",
  REVISION_REQUESTED: "requested a revision",
  VIDEO_APPROVED: "approved a video",
  FINAL_APPROVED: "gave final approval",
  EDITOR_ASSIGNED: "assigned an editor",
  PROJECT_DELETED: "deleted a project",
  MEMBER_UPDATED: "updated a member",
  TMT_PIN_CHANGED: "changed the TMT PIN"
};
