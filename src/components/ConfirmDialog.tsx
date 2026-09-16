"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";

export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmClassName = "btn-primary",
  endpoint,
  onClose
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClassName?: string;
  endpoint: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(endpoint, { method: "POST" });
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
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-muted">{description}</p>
      {error && <p className="mt-3 text-sm text-status-revision">{error}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className={confirmClassName} onClick={confirm} disabled={loading}>
          {loading ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
