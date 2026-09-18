"use client";

import { useState } from "react";
import DashboardProjectModal from "./DashboardProjectModal";

import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";

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

  const { language } = useLanguage();

  const t =
    language === "English"
      ? translations.English
      : translations.Korean;

  const monthNames =
    language === "English"
      ? [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December"
        ]
      : [
          "1월",
          "2월",
          "3월",
          "4월",
          "5월",
          "6월",
          "7월",
          "8월",
          "9월",
          "10월",
          "11월",
          "12월"
        ];

  function getMonthLabel(month: MonthlyStat) {
    const [year, monthNumber] = month.key.split("-").map(Number);

    if (!year || !monthNumber) {
      return month.label;
    }

    return language === "English"
      ? `${monthNames[monthNumber - 1]} ${year}`
      : `${year}년 ${monthNames[monthNumber - 1]}`;
  }

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
                  {language === "English" ? "Month" : "월"}
                </th>

                <th className="px-5 py-3 text-center font-medium">
                  {t.totalProjects}
                </th>

                <th className="px-5 py-3 text-center font-medium">
                  {t.reviewRequired}
                </th>

                <th className="px-5 py-3 text-center font-medium">
                  {t.revisionRequested}
                </th>

                <th className="px-5 py-3 text-center font-medium">
                  {t.approved}
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

                const monthLabel = getMonthLabel(month);

                return (
                  <tr
                    key={month.key}
                    className="border-b border-line last:border-0"
                  >
                    <td className="px-5 py-4">
                      <span className="font-medium text-ink">
                        {monthLabel}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          openModal(
                            `${monthLabel} · ${t.totalProjects}`,
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
                            `${monthLabel} · ${t.reviewRequired}`,
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
                            `${monthLabel} · ${t.revisionRequested}`,
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
                            `${monthLabel} · ${t.approved}`,
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