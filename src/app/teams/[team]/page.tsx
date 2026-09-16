"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TeamParam = "BEST_VIDEO_TEAM" | "EDITOR_TEAM" | "TMT";

const TEAM_LABEL: Record<TeamParam, string> = {
  BEST_VIDEO_TEAM: "Best Video Team",
  EDITOR_TEAM: "Editor Team",
  TMT: "TMT"
};

export default function NameEntryPage({ params }: { params: { team: string } }) {
  const router = useRouter();
  const team = params.team as TeamParam;
  const valid =
    team === "BEST_VIDEO_TEAM" ||
    team === "EDITOR_TEAM" ||
    team === "TMT";

  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [customName, setCustomName] = useState("");
  const [mode, setMode] = useState<"pick" | "new">("pick");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!valid) return;

    fetch(`/api/members?team=${team}`)
      .then((r) => r.json())
      .then((data) => {
        setMembers(data.members ?? []);
        if (!data.members?.length) setMode("new");
      });
  }, [team, valid]);

  if (!valid) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="text-sm text-muted">Unknown team.</p>
      </main>
    );
  }

  async function submit() {
    setError("");
    setLoading(true);

    try {
      const body =
        mode === "pick" && selectedId
          ? { memberId: selectedId }
          : { team, name: customName };

      if (mode === "new" && !customName.trim()) {
        setError("Please enter your name.");
        setLoading(false);
        return;
      }

      if (mode === "pick" && !selectedId) {
        setError("Please choose your name.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ?? "Something went wrong. Please try again."
        );
      }

      router.push("/dashboard");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-sm text-muted hover:text-ink">
          ← Back
        </Link>

        <div className="mt-6 mb-6">
          <p className="text-sm font-semibold text-brand">
            {TEAM_LABEL[team]}
          </p>

          <h1 className="mt-1 text-xl font-semibold text-ink">
            Please enter your name.
          </h1>
        </div>

        {members.length > 0 && (
          <div className="mb-4 flex gap-2 text-sm">
            <button
              onClick={() => setMode("pick")}
              className={
                mode === "pick"
                  ? "font-medium text-brand"
                  : "text-muted"
              }
            >
              Choose from list
            </button>

            <span className="text-muted">·</span>

            <button
              onClick={() => setMode("new")}
              className={
                mode === "new"
                  ? "font-medium text-brand"
                  : "text-muted"
              }
            >
              I'm not on the list
            </button>
          </div>
        )}

        {mode === "pick" && members.length > 0 ? (
          <select
            className="input"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">Select your name…</option>

            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="input"
            placeholder="e.g. Jimmy"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoFocus
          />
        )}

        {error && (
          <p className="mt-2 text-sm text-status-revision">
            {error}
          </p>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="btn-primary mt-4 w-full"
        >
          {loading ? "Entering…" : "ENTER"}
        </button>
      </div>
    </main>
  );
}