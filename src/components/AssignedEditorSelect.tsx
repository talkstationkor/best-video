"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

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
  editors,
}: Props) {
  const router = useRouter();
  const { language } = useLanguage();

  const isEnglish = language === "English";

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
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignedEditorId: selectedEditorId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            (isEnglish
              ? "Failed to assign Editor."
              : "편집자 배정에 실패했습니다.")
        );
      }

      setMessage(isEnglish ? "Saved" : "저장되었습니다.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : isEnglish
            ? "Something went wrong. Please try again."
            : "문제가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-ink">
          {isEnglish ? "Assigned Editor" : "배정된 편집자"}
        </p>

        <p className="mt-1 text-sm text-muted">
          {currentEditorName
            ? isEnglish
              ? `Currently assigned to ${currentEditorName}`
              : `${currentEditorName}님에게 현재 배정되어 있습니다`
            : isEnglish
              ? "No Editor assigned"
              : "배정된 편집자가 없습니다"}
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
          <option value="">
            {isEnglish ? "Unassigned" : "배정하지 않음"}
          </option>

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
          {loading
            ? isEnglish
              ? "Saving…"
              : "저장 중…"
            : isEnglish
              ? "Save"
              : "저장"}
        </button>
      </div>

      {message && <p className="text-sm text-muted">{message}</p>}
    </div>
  );
}