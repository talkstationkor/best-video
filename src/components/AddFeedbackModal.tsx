"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";

type FeedbackRow = {
  timestamp: string;
  message: string;
};

export default function AddFeedbackModal({
  versionId,
  onClose
}: {
  versionId: string;
  onClose: () => void;
}) {
  const router = useRouter();

  const [rows, setRows] = useState<FeedbackRow[]>([
    { timestamp: "", message: "" }
  ]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateRow(
    index: number,
    field: keyof FeedbackRow,
    value: string
  ) {
    setRows((current) =>
      current.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  }

  function addRow() {
    setRows((current) => [
      ...current,
      { timestamp: "", message: "" }
    ]);
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, i) => i !== index));
  }

  async function submit() {
    setError("");

    const validRows = rows.filter((row) => row.message.trim());

    if (validRows.length === 0) {
      setError("Please enter at least one feedback message.");
      return;
    }

    setLoading(true);

    try {
      for (const row of validRows) {
        const res = await fetch(
          `/api/versions/${versionId}/feedback`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              timestamp: row.timestamp.trim(),
              message: row.message.trim()
            })
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.error ?? "Something went wrong. Please try again."
          );
        }
      }

      onClose();
      router.refresh();
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
    <Modal title="Add Feedback" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-[120px_1fr_36px] gap-2">
          <div className="text-sm font-medium text-ink">
            Timestamp
          </div>

          <div className="text-sm font-medium text-ink">
            Feedback
          </div>

          <div />
        </div>

        <div className="space-y-2">
          {rows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-[120px_1fr_36px] items-start gap-2"
            >
              <input
                className="input"
                placeholder="02:13"
                value={row.timestamp}
                onChange={(e) =>
                  updateRow(index, "timestamp", e.target.value)
                }
              />

              <textarea
                className="input"
                rows={2}
                placeholder="Enter feedback..."
                value={row.message}
                onChange={(e) =>
                  updateRow(index, "message", e.target.value)
                }
              />

              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={rows.length === 1 || loading}
                className="btn-secondary h-10 px-2"
                aria-label="Remove feedback"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRow}
          disabled={loading}
          className="text-sm font-medium text-brand hover:underline"
        >
          + Add feedback
        </button>

        {error && (
          <p className="text-sm text-status-revision">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            className="btn-primary"
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}