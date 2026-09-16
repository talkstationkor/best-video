"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Feedback = {
  id: string;
  message: string;
  timestamp: string | null;
  status: string;
  createdAt: string;
  author: { name: string };
  resolvedBy: { name: string } | null;
};

export default function FeedbackItem({
  feedback,
  canResolve,
  canEditOrDelete
}: {
  feedback: Feedback;
  canResolve: boolean;
  canEditOrDelete: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(feedback.message);

  async function toggleResolved() {
    setBusy(true);
    try {
      await fetch(`/api/feedback/${feedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: feedback.status === "OPEN" ? "RESOLVED" : "OPEN" })
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    setBusy(true);
    try {
      await fetch(`/api/feedback/${feedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      setEditing(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this feedback item?")) return;
    setBusy(true);
    try {
      await fetch(`/api/feedback/${feedback.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-b border-line px-5 py-4 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: feedback.status === "OPEN" ? "#B14A34" : "#2F7D5B" }}
            />
            {feedback.timestamp && <span className="font-mono text-xs text-muted">{feedback.timestamp}</span>}
            <span className="text-xs text-muted">{feedback.author.name}</span>
          </div>
          {editing ? (
            <textarea
              className="input mt-2"
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          ) : (
            <p className="mt-1 text-sm text-ink">{feedback.message}</p>
          )}
          <p className="mt-1 text-xs font-medium" style={{ color: feedback.status === "OPEN" ? "#93381F" : "#1F6644" }}>
            {feedback.status === "OPEN" ? "Open" : `Resolved${feedback.resolvedBy ? ` by ${feedback.resolvedBy.name}` : ""}`}
          </p>
        </div>

        <div className="flex shrink-0 gap-2 text-xs">
          {editing ? (
            <>
              <button className="text-brand hover:underline" disabled={busy} onClick={saveEdit}>
                Save
              </button>
              <button className="text-muted hover:underline" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              {canResolve && (
                <button className="text-brand hover:underline" disabled={busy} onClick={toggleResolved}>
                  {feedback.status === "OPEN" ? "Mark Resolved" : "Reopen"}
                </button>
              )}
              {canEditOrDelete && (
                <>
                  <button className="text-muted hover:underline" onClick={() => setEditing(true)}>
                    Edit
                  </button>
                  <button className="text-status-revision hover:underline" disabled={busy} onClick={remove}>
                    Delete
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
