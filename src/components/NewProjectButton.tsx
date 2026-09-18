"use client";

import { useState } from "react";
import NewProjectModal from "./NewProjectModal";
import { useLanguage } from "@/components/LanguageProvider";

export default function NewProjectButton({
  canCreate
}: {
  canCreate: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();

  if (!canCreate) return null;

  const isEnglish = language === "English";

  return (
    <>
      <button
        className="btn-primary whitespace-nowrap"
        onClick={() => setOpen(true)}
      >
        {isEnglish ? "+ New Project" : "+ 새 프로젝트"}
      </button>

      {open && (
        <NewProjectModal onClose={() => setOpen(false)} />
      )}
    </>
  );
}
