"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

type Team = "BEST_VIDEO_TEAM" | "EDITOR_TEAM" | "TMT";
type Role = "SUBMITTER" | "EDITOR" | "REVIEWER" | "ADMIN";

export default function AddMemberForm() {
  const router = useRouter();
  const { language } = useLanguage();
  const isEnglish = language === "English";

  const [name, setName] = useState("");
  const [team, setTeam] = useState<Team>("BEST_VIDEO_TEAM");
  const [role, setRole] = useState<Role>("SUBMITTER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");

    if (!name.trim()) {
      setError(
        isEnglish
          ? "Name is required."
          : "이름을 입력해주세요."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, team, role })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ??
            (isEnglish
              ? "Something went wrong. Please try again."
              : "문제가 발생했습니다. 다시 시도해주세요.")
        );
      }

      setName("");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : isEnglish
            ? "Something went wrong."
            : "문제가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card px-6 py-5">
      <p className="mb-3 text-sm font-medium text-ink">
        {isEnglish ? "Add Member" : "멤버 추가"}
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted">
            {isEnglish ? "Name" : "이름"}
          </label>

          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted">
            {isEnglish ? "Team" : "팀"}
          </label>

          <select
            className="input"
            value={team}
            onChange={(e) =>
              setTeam(e.target.value as Team)
            }
          >
            <option value="BEST_VIDEO_TEAM">
              Best Video Team
            </option>

            <option value="EDITOR_TEAM">
              Editor Team
            </option>

            <option value="TMT">
              TMT
            </option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted">
            {isEnglish ? "Role" : "역할"}
          </label>

          <select
            className="input"
            value={role}
            onChange={(e) =>
              setRole(e.target.value as Role)
            }
          >
            <option value="SUBMITTER">
              {isEnglish ? "Submitter" : "제출자"}
            </option>

            <option value="EDITOR">
              {isEnglish ? "Editor" : "에디터"}
            </option>

            <option value="REVIEWER">
              {isEnglish ? "Reviewer" : "검토자"}
            </option>

            <option value="ADMIN">
              {isEnglish ? "Admin" : "관리자"}
            </option>
          </select>
        </div>

        <button
          className="btn-primary"
          onClick={submit}
          disabled={loading}
        >
          {loading
            ? isEnglish
              ? "Adding…"
              : "추가 중…"
            : isEnglish
              ? "Add Member"
              : "멤버 추가"}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-status-revision">
          {error}
        </p>
      )}
    </div>
  );
}