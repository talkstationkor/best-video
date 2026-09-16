"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";

export default function SubmitVersionModal({
  projectId,
  nextVersionNumber,
  onClose
}: {
  projectId: string;
  nextVersionNumber: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    if (!videoUrl.trim()) {
      setError("A Google Drive video link is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, notes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      onClose();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Submit New Version" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Version</label>
          <input className="input bg-paper" value={`V${nextVersionNumber}`} disabled />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Google Drive Video Link</label>
          <input
            className="input"
            placeholder="https://drive.google.com/file/d/..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Notes</label>
          <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && <p className="text-sm text-status-revision">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit} disabled={loading}>
            {loading ? "Submitting…" : "Submit Version"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
