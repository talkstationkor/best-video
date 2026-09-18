"use client";

import { useState } from "react";
import SubmitVersionModal from "./SubmitVersionModal";
import ConfirmDialog from "./ConfirmDialog";
import { useLanguage } from "@/components/LanguageProvider";

export default function ProjectActions({
  projectId,
  currentVersionId,
  currentVersionNumber,
  openFeedbackCount,
  canSubmitVersion,
  canRequestRevision,
  canApprove,
  isApproved
}: {
  projectId: string;
  currentVersionId: string;
  currentVersionNumber: number;
  openFeedbackCount: number;
  canSubmitVersion: boolean;
  canRequestRevision: boolean;
  canApprove: boolean;
  isApproved: boolean;
}) {
  const { language } = useLanguage();

  const [modal, setModal] = useState<"submit" | "revise" | "approve" | null>(
    null
  );

  if (isApproved) return null;

  const isEnglish = language === "English";

  return (
    <div className="flex flex-wrap gap-2">
      {canSubmitVersion && (
        <button className="btn-secondary" onClick={() => setModal("submit")}>
          {isEnglish ? "+ Submit New Version" : "+ 새 버전 제출"}
        </button>
      )}

      {canRequestRevision && (
        <button
          className="btn-danger"
          onClick={() => setModal("revise")}
          disabled={openFeedbackCount === 0}
          title={
            openFeedbackCount === 0
              ? isEnglish
                ? "Add at least one feedback item first"
                : "먼저 피드백을 하나 이상 추가해 주세요"
              : undefined
          }
        >
          {isEnglish ? "Request Revision" : "수정 요청"}
        </button>
      )}

      {canApprove && (
        <button className="btn-primary" onClick={() => setModal("approve")}>
          {isEnglish ? "Approve Video" : "영상 승인"}
        </button>
      )}

      {modal === "submit" && (
        <SubmitVersionModal
          projectId={projectId}
          nextVersionNumber={currentVersionNumber + 1}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "revise" && (
        <ConfirmDialog
          title={isEnglish ? "Request Revision" : "수정 요청"}
          description={
            isEnglish
              ? "Please confirm that you want to request a revision."
              : "수정을 요청하시겠습니까?"
          }
          confirmLabel={isEnglish ? "Request Revision" : "수정 요청"}
          confirmClassName="btn-danger"
          endpoint={`/api/versions/${currentVersionId}/request-revision`}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "approve" && (
        <ConfirmDialog
          title={isEnglish ? "Approve this video?" : "이 영상을 승인하시겠습니까?"}
          description={
            isEnglish
              ? `This will mark V${currentVersionNumber} as the approved version.`
              : `V${currentVersionNumber}을(를) 승인된 버전으로 지정합니다.`
          }
          confirmLabel={isEnglish ? "Approve" : "승인"}
          endpoint={`/api/versions/${currentVersionId}/approve`}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}