"use client";

import { useState } from "react";
import SubmitVersionModal from "./SubmitVersionModal";
import ConfirmDialog from "./ConfirmDialog";

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
  const [modal, setModal] = useState<"submit" | "revise" | "approve" | null>(null);

  if (isApproved) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {canSubmitVersion && (
        <button className="btn-secondary" onClick={() => setModal("submit")}>
          + Submit New Version
        </button>
      )}
      {canRequestRevision && (
        <button
          className="btn-danger"
          onClick={() => setModal("revise")}
          disabled={openFeedbackCount === 0}
          title={openFeedbackCount === 0 ? "Add at least one feedback item first" : undefined}
        >
          Request Revision
        </button>
      )}
      {canApprove && (
        <button className="btn-primary" onClick={() => setModal("approve")}>
          Approve Video
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
          title="Request Revision"
          description="Please confirm that you want to request a revision."
          confirmLabel="Request Revision"
          confirmClassName="btn-danger"
          endpoint={`/api/versions/${currentVersionId}/request-revision`}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "approve" && (
        <ConfirmDialog
          title="Approve this video?"
          description={`This will mark V${currentVersionNumber} as the approved version.`}
          confirmLabel="Approve"
          endpoint={`/api/versions/${currentVersionId}/approve`}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
