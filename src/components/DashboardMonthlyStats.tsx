"use client";

import { useState } from "react";
import DashboardProjectModal from "./DashboardProjectModal";

type Project = {
  id: string;
  projectName: string;
  currentVersion: number;
  status: string;
  updatedAt: string;
  assignedEditor: {
    name: string;
  } | null;
};

type MonthlyStat = {
  key: string;
  label: string;
  total: number;
  reviewRequired: number;
  revisionRequested: number;
  approved: number;
};

type Props = {
  monthlyStats: MonthlyStat[];
  monthlyProjects: Record<string, Project[]>;
};

type ModalState = {
  title: string;
  projects: Project[];
} | null;

export default function DashboardMonthlyStats({
  monthlyStats,
  monthlyProjects
}: Props) {
  const [modal, setModal] = useState<ModalState>(null);

  function openModal(
    title: string,
    projects: Project[]
  ) {
    setModal({
      title,
      projects
    });
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="px-5 py-3 font-medium">
                  월
                </th>

                <th className="px-5 py-3 text-center font-medium">
                  전체
                </th>

                <th className="px-5 py-3 text-center font-medium">
                  검수 대기
                </th>

                <th className="px-5 py-3 text-center font-medium">
                  수정 요청
                </th>

                <th className="px-5 py-3 text-center font-medium">
                  승인 완료
                </th>
              </tr>
            </thead>

            <tbody>
              {monthlyStats.map((month) => {
                const projects =
                  monthlyProjects[month.key] ?? [];

                const reviewProjects = projects.filter(
                  (project) =>
                    project.status === "REVIEW_REQUIRED"
                );

                const revisionProjects = projects.filter(
                  (project) =>
                    project.status === "REVISION_REQUESTED"
                );

                const approvedProjects = projects.filter(
                  (project) =>
                    project.status === "APPROVED"
                );

                return (
                  <tr
                    key={month.key}
                    className="border-b border-line last:border-0"
                  >
                    <td className="px-5 py-4">
                      <span className="font-medium text-ink">
                        {month.label}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          openModal(
                            `${month.label} · 전체 프로젝트`,
                            projects
                          )
                        }
                        className="font-semibold text-brand hover:underline"
                      >
                        {month.total}
                      </button>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          openModal(
                            `${month.label} · 검수 대기`,
                            reviewProjects
                          )
                        }
                        className="font-semibold text-brand hover:underline"
                      >
                        {month.reviewRequired}
                      </button>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          openModal(
                            `${month.label} · 수정 요청`,
                            revisionProjects
                          )
                        }
                        className="font-semibold text-brand hover:underline"
                      >
                        {month.revisionRequested}
                      </button>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          openModal(
                            `${month.label} · 승인 완료`,
                            approvedProjects
                          )
                        }
                        className="font-semibold text-brand hover:underline"
                      >
                        {month.approved}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <DashboardProjectModal
          title={modal.title}
          projects={modal.projects}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}