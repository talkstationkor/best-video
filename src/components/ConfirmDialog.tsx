"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { useLanguage } from "@/components/LanguageProvider";

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
  const { language } = useLanguage();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEnglish = language === "English";

  async function confirm() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ??
            (isEnglish
              ? "Something went wrong. Please try again."
              : "문제가 발생했습니다. 다시 시도해주세요.")
        );
      }

      onClose();
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : isEnglish
            ? "Something went wrong."
            : "문제가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-muted">{description}</p>

      {error && (
        <p className="mt-3 text-sm text-status-revision">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <button
          className="btn-secondary"
          onClick={onClose}
        >
          {isEnglish ? "Cancel" : "취소"}
        </button>

        <button
          className={confirmClassName}
          onClick={confirm}
          disabled={loading}
        >
          {loading
            ? isEnglish
              ? "Working…"
              : "처리 중…"
            : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
