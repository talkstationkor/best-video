"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Team = "BEST_VIDEO_TEAM" | "EDITOR_TEAM" | "TMT";
type Role = "SUBMITTER" | "EDITOR" | "REVIEWER" | "ADMIN";

export default function AddMemberForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [team, setTeam] = useState<Team>("BEST_VIDEO_TEAM");
  const [role, setRole] = useState<Role>("SUBMITTER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
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
          data.error ?? "Something went wrong. Please try again."
        );
      }

      setName("");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card px-6 py-5">
      <p className="mb-3 text-sm font-medium text-ink">
        Add Member
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-muted">
            Name
          </label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted">
            Team
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
            Role
          </label>
          <select
            className="input"
            value={role}
            onChange={(e) =>
              setRole(e.target.value as Role)
            }
          >
            <option value="SUBMITTER">
              Submitter
            </option>
            <option value="EDITOR">
              Editor
            </option>
            <option value="REVIEWER">
              Reviewer
            </option>
            <option value="ADMIN">
              Admin
            </option>
          </select>
        </div>

        <button
          className="btn-primary"
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Adding…" : "Add Member"}
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