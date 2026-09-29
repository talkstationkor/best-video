"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

type Team = "BEST_VIDEO_TEAM" | "EDITOR_TEAM" | "TMT";

const TEAMS: {
  id: Team;
  label: string;
  ko: string;
  en: string;
}[] = [
  {
    id: "BEST_VIDEO_TEAM",
    label: "Best Video Team",
    ko: "프로젝트 생성·편집자 배정·검토",
    en: "Create projects, assign editors, review"
  },
  {
    id: "EDITOR_TEAM",
    label: "Editor Team",
    ko: "영상 편집 및 버전 제출",
    en: "Edit videos and submit versions"
  },
  {
    id: "TMT",
    label: "TMT",
    ko: "검토·피드백·승인",
    en: "Review, give feedback and approve"
  }
];

function isTeam(value: string | null): value is Team {
  return TEAMS.some((t) => t.id === value);
}

// Team and name are picked on one screen: choosing a team loads its
// member list right below, so entering takes two clicks instead of two
// pages.
export default function EntryForm({
  initialTeam
}: {
  initialTeam: string | null;
}) {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const en = language === "English";

  const [team, setTeam] = useState<Team | null>(
    isTeam(initialTeam) ? initialTeam : null
  );
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [customName, setCustomName] = useState("");
  const [mode, setMode] = useState<"pick" | "new">("pick");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!team) return;

    let cancelled = false;
    setMembersLoaded(false);
    setSelectedId("");
    setError("");

    fetch(`/api/members?team=${team}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list = data.members ?? [];
        setMembers(list);
        setMode(list.length ? "pick" : "new");
        setMembersLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setMembers([]);
        setMode("new");
        setMembersLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [team]);

  async function submit() {
    if (!team) return;
    setError("");

    if (mode === "pick" && !selectedId) {
      setError(en ? "Please choose your name." : "이름을 선택해 주세요.");
      return;
    }

    if (mode === "new" && !customName.trim()) {
      setError(en ? "Please enter your name." : "이름을 입력해 주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "pick"
            ? { memberId: selectedId }
            : { team, name: customName }
        )
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ??
            (en
              ? "Something went wrong. Please try again."
              : "문제가 발생했습니다. 다시 시도해 주세요.")
        );
      }

      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : en
            ? "Something went wrong. Please try again."
            : "문제가 발생했습니다. 다시 시도해 주세요."
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-tight text-brand">
            BEST VIDEO
          </p>

          <h1 className="mt-3 text-2xl font-semibold text-ink">
            {en ? "Video Review & Approval" : "영상 검토 · 승인"}
          </h1>

          <p className="mt-2 text-sm text-muted">
            {en ? "Choose your team and name." : "팀과 이름을 선택해 주세요."}
          </p>

          <select
            className="mt-3 rounded-md border border-line bg-white px-2 py-1 text-xs text-muted"
            value={language}
            onChange={(e) =>
              setLanguage(e.target.value as "한국어" | "English")
            }
            aria-label="Language"
          >
            <option value="한국어">한국어</option>
            <option value="English">English</option>
          </select>
        </div>

        <div className="space-y-2" role="radiogroup">
          {TEAMS.map((t) => {
            const active = team === t.id;

            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={t.label}
                onClick={() => setTeam(t.id)}
                className={`card block w-full px-5 py-3 text-left transition hover:border-brand ${
                  active ? "!border-brand ring-1 ring-brand bg-brand-soft" : ""
                }`}
              >
                <div className="font-medium text-ink">{t.label}</div>
                <div className="mt-0.5 text-sm text-muted">
                  {en ? t.en : t.ko}
                </div>
              </button>
            );
          })}
        </div>

        {team && (
          <div className="mt-6">
            {!membersLoaded ? (
              <p className="text-sm text-muted">
                {en ? "Loading…" : "불러오는 중…"}
              </p>
            ) : (
              <>
                {members.length > 0 && (
                  <div className="mb-3 flex gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => setMode("pick")}
                      className={
                        mode === "pick" ? "font-medium text-brand" : "text-muted"
                      }
                    >
                      {en ? "Choose from list" : "목록에서 선택"}
                    </button>

                    <span className="text-muted">·</span>

                    <button
                      type="button"
                      onClick={() => setMode("new")}
                      className={
                        mode === "new" ? "font-medium text-brand" : "text-muted"
                      }
                    >
                      {en ? "I'm not on the list" : "목록에 없어요"}
                    </button>
                  </div>
                )}

                {mode === "pick" && members.length > 0 ? (
                  <select
                    className="input"
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    <option value="">
                      {en ? "Select your name…" : "이름 선택…"}
                    </option>

                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input"
                    placeholder={en ? "e.g. Jimmy" : "예: 홍길동"}
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    autoFocus
                  />
                )}

                {error && (
                  <p className="mt-2 text-sm text-status-revision">{error}</p>
                )}

                <button
                  type="button"
                  onClick={submit}
                  disabled={loading}
                  className="btn-primary mt-4 w-full"
                >
                  {loading
                    ? en
                      ? "Entering…"
                      : "입장 중…"
                    : en
                      ? "Enter"
                      : "입장"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
