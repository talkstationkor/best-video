"use client";

import Link from "next/link";

import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import DashboardMonthlyStats from "@/components/DashboardMonthlyStats";

import { greetingFor, timeAgo, ACTION_LABEL } from "@/lib/format";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/lib/translations";

type MonthlyStat = {
  key: string;
  label: string;
  total: number;
  reviewRequired: number;
  revisionRequested: number;
  approved: number;
};

type DashboardProject = {
  id: string;
  projectName: string;
  currentVersion: number;
  status: string;
  updatedAt: string;
  assignedEditor: {
    name: string;
  } | null;
};

type DashboardContentProps = {
  memberName: string;
  hour: number;
  canSeeAll: boolean;
  isEditor: boolean;

  stats: {
    label: string;
    value: number;
    href: string;
  }[];

  monthlyStats: MonthlyStat[];

  monthlyProjects: Record<
    string,
    DashboardProject[]
  >;

  actionProjects: any[];

  recentProjects: any[];

  recentActivity: any[];
};

export default function DashboardContent({
  memberName,
  hour,
  canSeeAll,
  isEditor,
  stats,
  monthlyStats,
  monthlyProjects,
  actionProjects,
  recentProjects,
  recentActivity,
}: DashboardContentProps) {
  const { language } = useLanguage();

const t =
  language === "English"
    ? translations.English
    : translations.Korean;

const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT":
        return t.statusDraft;

      case "REVIEW_REQUIRED":
        return t.statusReviewRequired;

      case "REVISION_REQUESTED":
        return t.statusRevisionRequested;

      case "APPROVED":
        return t.statusApproved;

      case "WORKING":
        return t.statusWorking;

      default:
        return status;
    }
  };

  return (
    <div>
      {/* 인사말 */}
      <div>
        <p className="text-2xl font-semibold text-ink">
          {greetingFor(hour)}, {memberName}.
        </p>

        <p className="mt-1 text-sm text-muted">
          {t.dashboardDescription}
        </p>
      </div>

      {/* 전체 현황 */}
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => {
          const labelMap: Record<string, string> = {
            "전체 프로젝트": t.totalProjects,
            "검수 대기": t.reviewRequired,
            "수정 요청": t.revisionRequested,
            "승인 완료": t.approved,
          };

          return (
            <Link
              key={s.label}
              href={s.href}
              className="card px-5 py-4 transition hover:border-brand"
            >
              <p className="label-eyebrow">
                {labelMap[s.label] ?? s.label}
              </p>

              <p className="mt-2 text-2xl font-semibold text-ink">
                {s.value}
              </p>
            </Link>
          );
        })}
      </div>

      {/* 월별 현황 */}
      <section className="mt-10">
        <div className="mb-3">
          <p className="label-eyebrow">
            {t.monthlyOverview}
          </p>

          <h2 className="mt-1 text-xl font-semibold text-ink">
            {t.monthlyTitle}
          </h2>

          <p className="mt-1 text-sm text-muted">
            {t.monthlyDescription}
          </p>
        </div>

        <DashboardMonthlyStats
          monthlyStats={monthlyStats}
          monthlyProjects={monthlyProjects}
        />
      </section>

      {/* 내가 처리해야 할 작업 */}
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <p className="label-eyebrow">
            {canSeeAll
              ? t.reviewVideos
              : isEditor
                ? t.assignedWork
                : t.myWork}
          </p>

          <Link
            href="/projects"
            className="text-sm text-brand hover:underline"
          >
            {t.viewAllProjects}
          </Link>
        </div>

        {actionProjects.length === 0 ? (
          <EmptyState
            title={t.noTasks}
            description={
              canSeeAll
                ? t.noReviewVideos
                : isEditor
                  ? t.noAssignedVideos
                  : t.noRevisionVideos
            }
          />
        ) : (
          <div className="space-y-3">
            {actionProjects.map((p) => {
              const v = p.versions[0];

              return (
                <div
                  key={p.id}
                  className="card flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-ink">
                      {p.projectName}
                    </p>

                    <p className="mt-1 text-sm text-muted">
                      V
                      {v?.versionNumber ??
                        p.currentVersion}
                      {" · "}

                      {canSeeAll
                        ? `${t.submittedBy} ${
                            v?.submittedBy?.name ?? "-"
                          }`
                        : isEditor
                          ? p.workflowStatus ===
                            "EDITOR_WORKING"
                            ? t.videoWorkInProgress
                            : p.status ===
                                "REVISION_REQUESTED"
                              ? t.revisionCheckRequired
                              : t.workStartRequired
                          : `${
                              v?.feedback.length ?? 0
                            }${t.feedbackRequired}`}
                    </p>
                  </div>

                  <Link
                    href={`/projects/${p.id}`}
                    className="btn-secondary whitespace-nowrap"
                  >
                    {t.viewProject}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Project Overview */}
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <p className="label-eyebrow">
            {t.projectOverview}
          </p>

          <Link
            href="/projects"
            className="text-sm text-brand hover:underline"
          >
            {t.viewAll}
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <EmptyState
            title={t.noProjects}
            description={
              isEditor
                ? t.noAssignedProjects
                : t.createFirstProject
            }
            action={
              !isEditor ? (
                <Link
                  href="/projects"
                  className="btn-primary"
                >
                  {t.newProject}
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-muted">
                    <th className="px-5 py-3 font-medium">
                      {t.project}
                    </th>

                    <th className="px-5 py-3 font-medium">
                      {t.currentVersion}
                    </th>

                    <th className="px-5 py-3 font-medium">
                      {t.currentStatus}
                    </th>

                    <th className="px-5 py-3 font-medium">
                      {t.lastModified}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentProjects.map((p) => {
                    const currentVersion =
                      p.versions[0];

                    return (
                      <tr
                        key={p.id}
                        className="border-b border-line last:border-0 hover:bg-paper/60"
                      >
                        <td className="px-5 py-4">
                          <Link
                            href={`/projects/${p.id}`}
                            className="font-medium text-ink hover:text-brand hover:underline"
                          >
                            {p.projectName}
                          </Link>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-medium text-ink">
                            V
                            {currentVersion?.versionNumber ??
                              p.currentVersion}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <StatusBadge
                              status={p.status}
                            />

                            <span className="text-xs text-muted">
                              {getStatusLabel(
                                p.status
                              )}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-muted">
                          {timeAgo(p.updatedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* 최근 활동 */}
      <section className="mt-10">
        <p className="label-eyebrow mb-3">
          {t.recentActivity}
        </p>

        {recentActivity.length === 0 ? (
          <EmptyState
            title={t.noActivity}
          />
        ) : (
          <div className="card divide-y divide-line">
            {recentActivity.map((a) => (
              <div
                key={a.id}
                className="px-5 py-4"
              >
                <p className="text-sm text-ink">
                  <span className="font-medium">
                    {a.actor.name}
                  </span>{" "}
                  {ACTION_LABEL[a.action] ??
                    a.action.toLowerCase()}

                  {a.version
                    ? ` (V${a.version.versionNumber})`
                    : ""}
                </p>

                {a.project && (
                  <p className="mt-0.5 text-sm text-muted">
                    {a.project.projectName}
                  </p>
                )}

                <p className="mt-1 text-xs text-muted">
                  {timeAgo(a.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}