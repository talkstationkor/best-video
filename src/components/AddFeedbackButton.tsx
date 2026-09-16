"use client";

import { useState } from "react";
import AddFeedbackModal from "./AddFeedbackModal";

export default function AddFeedbackButton({ versionId, canAdd }: { versionId: string; canAdd: boolean }) {
  const [open, setOpen] = useState(false);
  if (!canAdd) return null;
  return (
    <>
      <button className="btn-secondary" onClick={() => setOpen(true)}>
        + Add Feedback
      </button>
      {open && <AddFeedbackModal versionId={versionId} onClose={() => setOpen(false)} />}
    </>
  );
}
