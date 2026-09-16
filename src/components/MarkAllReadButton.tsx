"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markAll() {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true })
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="btn-secondary" onClick={markAll} disabled={loading}>
      {loading ? "Marking…" : "Mark all as read"}
    </button>
  );
}
