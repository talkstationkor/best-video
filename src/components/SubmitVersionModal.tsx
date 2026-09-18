"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { useLanguage } from "@/components/LanguageProvider";

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
  const { language } = useLanguage();

  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEnglish = language === "English";

  async function submit() {
    setError("");

    if (!videoUrl.trim()) {
      setError(
        isEnglish
          ? "A Google Drive video link is required."
          : "Google Drive 동영상 링크가 필요합니다."
      );
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
    <Modal
      title={isEnglish ? "Submit New Version" : "새 버전 제출"}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {isEnglish ? "Version" : "버전"}
          </label>

          <input
            className="input bg-paper"
            value={`V${nextVersionNumber}`}
            disabled
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {isEnglish ? "Google Drive Video Link" : "Google Drive 동영상 링크"}
          </label>

          <input
            className="input"
            placeholder="https://drive.google.com/file/d/..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            {isEnglish ? "Notes" : "메모"}
          </label>

          <textarea
            className="input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-status-revision">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>
            {isEnglish ? "Cancel" : "취소"}
          </button>

          <button
            className="btn-primary"
            onClick={submit}
            disabled={loading}
          >
            {loading
              ? isEnglish
                ? "Submitting…"
                : "제출 중…"
              : isEnglish
                ? "Submit Version"
                : "버전 제출"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
