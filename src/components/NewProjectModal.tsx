"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";

export default function NewProjectModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [details, setDetails] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    if (!projectName.trim() || !videoUrl.trim()) {
      setError("Project name and video link are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, details, videoUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      onClose();
      router.push(`/projects/${data.project.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="New Project" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Project Name *</label>
          <input className="input" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Details</label>
          <textarea className="input" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Google Drive Video Link *</label>
          <input
            className="input"
            placeholder="https://drive.google.com/file/d/..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-status-revision">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit} disabled={loading}>
            {loading ? "Creating…" : "Create Project"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
