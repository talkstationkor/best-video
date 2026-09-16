"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Editor = {
  id: string;
  name: string;
};

type Props = {
  projectId: string;
  currentEditorId: string | null;
  currentEditorName: string | null;
  editors: Editor[];
};

export default function AssignedEditorSelect({
  projectId,
  currentEditorId,
  currentEditorName,
  editors
}: Props) {
  const router = useRouter();

  const [selectedEditorId, setSelectedEditorId] = useState(
    currentEditorId ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function saveAssignment() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assignedEditorId: selectedEditorId || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to assign Editor.");
      }

      setMessage("Saved");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-ink">Assigned Editor</p>

        <p className="mt-1 text-sm text-muted">
          {currentEditorName
            ? `Currently assigned to ${currentEditorName}`
            : "No Editor assigned"}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          className="input flex-1"
          value={selectedEditorId}
          onChange={(event) => {
            setSelectedEditorId(event.target.value);
            setMessage("");
          }}
          disabled={loading}
        >
          <option value="">Unassigned</option>

          {editors.map((editor) => (
            <option key={editor.id} value={editor.id}>
              {editor.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn-primary"
          onClick={saveAssignment}
          disabled={loading}
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </div>

      {message && (
        <p className="text-sm text-muted">
          {message}
        </p>
      )}
    </div>
  );
}