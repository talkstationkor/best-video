"use client";

import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import { useLanguage } from "@/components/LanguageProvider";

export default function DeleteProjectButton({
  projectId,
  projectName
}: {
  projectId: string;
  projectName: string;
}) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);

  const isEnglish = language === "English";

  return (
    <>
      <button
        type="button"
        className="btn-danger w-fit"
        onClick={() => setOpen(true)}
      >
        {isEnglish ? "Delete Project" : "프로젝트 삭제"}
      </button>

      {open && (
        <ConfirmDialog
          title={isEnglish ? "Delete this project?" : "프로젝트를 삭제하시겠습니까?"}
          description={
            isEnglish
              ? `"${projectName}" and all of its versions, videos, feedback and notifications will be deleted. This cannot be undone.`
              : `"${projectName}"의 모든 버전·영상·피드백·알림이 함께 삭제되며 되돌릴 수 없습니다.`
          }
          confirmLabel={isEnglish ? "Delete" : "삭제"}
          confirmClassName="btn-danger"
          endpoint={`/api/projects/${projectId}`}
          method="DELETE"
          redirectTo="/projects"
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
