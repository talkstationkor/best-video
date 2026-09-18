"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export default function ProjectFilters({
  showTeamFilter
}: {
  showTeamFilter: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const { language } = useLanguage();

  const isEnglish = language === "English";

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) params.set(key, value);
    else params.delete(key);

    router.push(`/projects?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        className="input max-w-xs"
        placeholder={
          isEnglish ? "Search project..." : "프로젝트 검색..."
        }
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) =>
          e.key === "Enter" && setParam("q", q)
        }
      />

      <select
        className="input w-auto"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => setParam("status", e.target.value)}
      >
        <option value="">
          {isEnglish ? "All statuses" : "모든 상태"}
        </option>

        <option value="DRAFT">
          {isEnglish ? "Draft" : "초안"}
        </option>

        <option value="REVIEW_REQUIRED">
          {isEnglish ? "Review Required" : "검토 필요"}
        </option>

        <option value="REVISION_REQUESTED">
          {isEnglish ? "Revision Requested" : "수정 요청"}
        </option>

        <option value="APPROVED">
          {isEnglish ? "Approved" : "승인됨"}
        </option>
      </select>

      {showTeamFilter && (
        <select
          className="input w-auto"
          value={searchParams.get("team") ?? ""}
          onChange={(e) => setParam("team", e.target.value)}
        >
          <option value="">
            {isEnglish ? "All teams" : "모든 팀"}
          </option>

          <option value="BEST_VIDEO_TEAM">
            Best Video Team
          </option>

          <option value="TMT">
            TMT
          </option>
        </select>
      )}

      <input
        type="month"
        className="input w-auto"
        value={searchParams.get("month") ?? ""}
        onChange={(e) => setParam("month", e.target.value)}
        aria-label={isEnglish ? "Month" : "월"}
      />
    </div>
  );
}
