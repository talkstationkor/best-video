"use client";

import { useLanguage } from "@/components/LanguageProvider";

const STYLES: Record<
  string,
  { bg: string; fg: string; ko: string; en: string }
> = {
  DRAFT: {
    bg: "#F1F5F9",
    fg: "#475569",
    ko: "작업 준비",
    en: "Draft"
  },
  REVIEW_REQUIRED: {
    bg: "#FEF3C7",
    fg: "#92400E",
    ko: "검수 대기",
    en: "Review Required"
  },
  REVISION_REQUESTED: {
    bg: "#FEE2E2",
    fg: "#991B1B",
    ko: "수정 요청",
    en: "Revision Requested"
  },
  APPROVED: {
    bg: "#DCFCE7",
    fg: "#166534",
    ko: "승인 완료",
    en: "Approved"
  },
  OPEN: {
    bg: "#FEE2E2",
    fg: "#991B1B",
    ko: "미해결",
    en: "Open"
  },
  RESOLVED: {
    bg: "#DCFCE7",
    fg: "#166534",
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