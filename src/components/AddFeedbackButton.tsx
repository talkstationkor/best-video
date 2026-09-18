"use client";

import { useState } from "react";
import AddFeedbackModal from "./AddFeedbackModal";
import { useLanguage } from "@/components/LanguageProvider";

export default function AddFeedbackButton({
  versionId,
  canAdd
}: {
  versionId: string;
  canAdd: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();

  const isEnglish = language === "English";

  if (!canAdd) return null;

  return (
    <>
      <button
        className="btn-secondary"
        onClick={() => setOpen(true)}
      >
        + {isEnglish ? "Add Feedback" : "피드백 추가"}
      </button>

      {open && (
        <AddFeedbackModal
          versionId={versionId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}