"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ProjectFilters({ showTeamFilter }: { showTeamFilter: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

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
        placeholder="Search project..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && setParam("q", q)}
      />
      <select
        className="input w-auto"
        value={searchParams.get("status") ?? ""}
        onChange={(e) => setParam("status", e.target.value)}
      >
        <option value="">All statuses</option>
        <option value="DRAFT">Draft</option>
        <option value="REVIEW_REQUIRED">Review Required</option>
        <option value="REVISION_REQUESTED">Revision Requested</option>
        <option value="APPROVED">Approved</option>
      </select>
      {showTeamFilter && (
        <select
          className="input w-auto"
          value={searchParams.get("team") ?? ""}
          onChange={(e) => setParam("team", e.target.value)}
        >
          <option value="">All teams</option>
          <option value="BEST_VIDEO_TEAM">Best Video Team</option>
          <option value="TMT">TMT</option>
        </select>
      )}
      <input
        type="month"
        className="input w-auto"
        value={searchParams.get("month") ?? ""}
        onChange={(e) => setParam("month", e.target.value)}
      />
    </div>
  );
}
