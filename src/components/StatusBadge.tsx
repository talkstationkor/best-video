"use client";

import { useLanguage } from "@/components/LanguageProvider";

const STYLES: Record<
  string,
  { bg: string; fg: string; ko: string; en: string }
> = {
  DRAFT: {
    bg: "#EEEEEA",
    fg: "#5B5D64",
    ko: "작업 준비",
    en: "Draft"
  },
  REVIEW_REQUIRED: {
    bg: "#F6EBD4",
    fg: "#8A6414",
    ko: "검수 대기",
    en: "Review Required"
  },
  REVISION_REQUESTED: {
    bg: "#F5E1DA",
    fg: "#93381F",
    ko: "수정 요청",
    en: "Revision Requested"
  },
  APPROVED: {
    bg: "#DFEFE5",
    fg: "#1F6644",
    ko: "승인 완료",
    en: "Approved"
  },
  OPEN: {
    bg: "#F5E1DA",
    fg: "#93381F",
    ko: "미해결",
    en: "Open"
  },
  RESOLVED: {
    bg: "#DFEFE5",
    fg: "#1F6644",
    ko: "해결됨",
    en: "Resolved"
  }
};

export default function StatusBadge({ status }: { status: string }) {
  const { language } = useLanguage();

  const style = STYLES[status] ?? STYLES.DRAFT;
  const label = language === "English" ? style.en : style.ko;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: style.fg }}
      />
      {label}
    </span>
  );
}