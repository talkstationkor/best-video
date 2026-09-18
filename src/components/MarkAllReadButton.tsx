"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

export default function MarkAllReadButton() {
  const router = useRouter();
  const { language } = useLanguage();
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
      {loading
        ? language === "English"
          ? "Marking…"
          : "처리 중…"
        : language === "English"
          ? "Mark all as read"
          : "모두 읽음으로 표시"}
    </button>
  );
}