import Link from "next/link";
import AppShell, { requireMember } from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import DashboardMonthlyStats from "@/components/DashboardMonthlyStats";
import { prisma } from "@/lib/db";
import { permissions } from "@/lib/permissions";
import { greetingFor, timeAgo, ACTION_LABEL } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "작업 준비",
  REVIEW_REQUIRED: "검수 대기",
  REVISION_REQUESTED: "수정 요청",
  APPROVED: "승인",
  WORKING: "작업 중"
};

const MONTH_LABEL = [
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

export default async function DashboardPage() {
  const member = await requireMember();

  const canSeeAll = permissions.canViewAllProjects(member);
  const isEditor = member.role === "EDITOR";

  const projectScope = canSeeAll
    ? {}
    : isEditor
      ? { assignedEditorId: member.id }
      : { team: member.team };

  const [
    total,
    reviewRequired,
    revisionRequested,
    approved
  ] = await Promise.all([
    prisma.project.count({
      where: projectScope
    }),

    prisma.project.count({
      where: {
        ...projectScope,
        status: "REVIEW_REQUIRED"
      }
    }),

    prisma.project.count({
      where: {
        ...projectScope,
        status: "REVISION_REQUESTED"
      }
    }),

    prisma.project.count({
      where: {
        ...projectScope,
        status: "APPROVED"
      }
    })
  ]);

  /*
   * 최근 12개월 월별 통계
   *
   * 기준:
   * 프로젝트 생성일
   *
   * 각 월에 생성된 프로젝트 중
   * 현재 상태가 무엇인지 집계합니다.
   */
  const now = new Date();

  const monthRanges = Array.from(
    { length: 12 },
    (_, index) => {
      const offset = 11 - index;

      const start = new Date(
        now.getFullYear(),
        now.getMonth() - offset,
        1
      );

      const end = new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        1
      );

      return {
        key: `${start.getFullYear()}-${String(
          start.getMonth() + 1
        ).padStart(2, "0")}`,

        label: `${start.getFullYear()}년 ${
          MONTH_LABEL[start.getMonth()]
        }`,

        start,
        end
      };
    }
  );

  const monthlyStatsResults = await Promise.all(
    monthRanges.map(async (range) => {
      const monthWhere = {
        ...projectScope,
        createdAt: {
          gte: range.start,
          lt: range.end
        }
      };

      const [
        monthTotal,
        monthReviewRequired,
        monthRevisionRequested,
        monthApproved
      ] = await Promise.all([
        prisma.project.count({
          where: monthWhere
        }),

        prisma.project.count({
          where: {
            ...monthWhere,
            status: "REVIEW_REQUIRED"
          }
        }),

        prisma.project.count({
          where: {
            ...monthWhere,
            status: "REVISION_REQUESTED"
          }
        }),

        prisma.project.count({
          where: {
            ...monthWhere,
            status: "APPROVED"
          }
        })
      ]);

      return {
        key: range.key,
        label: range.label,
        total: monthTotal,
        reviewRequired: monthReviewRequired,
        revisionRequested: monthRevisionRequested,
        approved: monthApproved
      };
    })
  );

  const monthlyStats: MonthlyStat[] =
    monthlyStatsResults;

  /*
   * 월별 프로젝트 목록
   *
   * 숫자를 클릭했을 때 팝업에 표시하기 위한 데이터입니다.
   */
  const monthlyProjectResults = await Promise.all(
    monthRanges.map(async (range) => {
      const projects = await prisma.project.findMany({
        where: {
          ...projectScope,
          createdAt: {
            gte: range.start,
            lt: range.end
          }
        },

        orderBy: {
          updatedAt: "desc"
        },

        select: {
          id: true,
          projectName: true,
          currentVersion: true,
          status: true,
          updatedAt: true,

          assignedEditor: {
            select: {
              name: true
            }
          }
        }
      });

      return {
        key: range.key,
        projects
      };
    })
  );

  const monthlyProjects: Record<
    string,
    DashboardProject[]
  > = {};

  for (const result of monthlyProjectResults) {
    monthlyProjects[result.key] =
      result.projects.map((project) => ({
        id: project.id,
        projectName: project.projectName,
        currentVersion: project.currentVersion,
        status: project.status,
        updatedAt: project.updatedAt.toISOString(),
        assignedEditor: project.assignedEditor
      }));
  }

  const actionProjects = await prisma.project.findMany({
    where: {
      ...projectScope,

      ...(isEditor
        ? {
            OR: [
              {
                workflowStatus: "EDITOR_WORKING"
              },
              {
                status: "REVISION_REQUESTED"
              },
              {
                status: "DRAFT"
              }
            ]
          }
        : {
            status: canSeeAll
              ? "REVIEW_REQUIRED"
              : "REVISION_REQUESTED"
          })
    },

    orderBy: {
      updatedAt: "desc"
    },

    take: 5,

    include: {
      versions: {
        where: isEditor
          ? {}
          : canSeeAll
            ? {
                status: "REVIEW_REQUIRED"
              }
            : {
                status: "REVISION_REQUESTED"
              },

        orderBy: {
          versionNumber: "desc"
        },

        take: 1,

        include: {
          submittedBy: {
            select: {
              name: true
            }
          },

          feedback: {
            where: {
              status: "OPEN"
            }
          }
        }
      },

      assignedEditor: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  const recentProjects =
    await prisma.project.findMany({
      where: projectScope,

      orderBy: {
        updatedAt: "desc"
      },

      take: 6,

      include: {
        versions: {
          orderBy: {
            versionNumber: "desc"
          },

          take: 1
        },

        assignedEditor: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

  const recentActivity =
    await prisma.activityLog.findMany({
      where: canSeeAll
        ? {}
        : isEditor
          ? {
              project: {
                assignedEditorId: member.id
              }
            }
          : {
              OR: [
                {
                  actorId: member.id
                },
                {
                  project: {
                    team: member.team
                  }
                }
              ]
            },

      orderBy: {
        createdAt: "desc"
      },

      take: 6,

      include: {
        actor: {
          select: {
            name: true
          }
        },

        project: {
          select: {
            projectName: true
          }
        },

        version: true
      }
    });

  const hour = new Date().getHours();

  const stats = [
    {
      label: "전체 프로젝트",
      value: total,
      href: "/projects"
    },

    {
      label: "검수 대기",
      value: reviewRequired,
      href: "/projects?status=REVIEW_REQUIRED"
    },

    {
      label: "수정 요청",
      value: revisionRequested,
      href: "/projects?status=REVISION_REQUESTED"
    },

    {
      label: "승인 완료",
      value: approved,
      href: "/projects?status=APPROVED"
    }
  ];

  return (
    <AppShell>
      <div>
        <p className="text-2xl font-semibold text-ink">
          {greetingFor(hour)}, {member.name}.
        </p>

        <p className="mt-1 text-sm text-muted">
          지금 처리해야 할 영상과 최근 작업을 확인하세요.
        </p>
      </div>

      {/* 전체 현황 */}
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="card px-5 py-4 transition hover:border-brand"
          >
            <p className="label-eyebrow">
              {s.label}
            </p>

            <p className="mt-2 text-2xl font-semibold text-ink">
              {s.value}
            </p>
          </Link>
        ))}
      </div>

      {/* 월별 현황 */}
      <section className="mt-10">
        <div className="mb-3">
          <p className="label-eyebrow">
            MONTHLY PROJECT OVERVIEW
          </p>

          <h2 className="mt-1 text-xl font-semibold text-ink">
            월별 프로젝트 현황
          </h2>

          <p className="mt-1 text-sm text-muted">
            최근 12개월 동안 생성된 프로젝트를
            월별로 확인합니다. 숫자를 클릭하면 해당
            프로젝트 목록을 볼 수 있습니다.
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
              ? "검수가 필요한 영상"
              : isEditor
                ? "내게 배정된 작업"
                : "내가 처리해야 할 작업"}
          </p>

          <Link
            href="/projects"
            className="text-sm text-brand hover:underline"
          >
            전체 프로젝트 보기
          </Link>
        </div>

        {actionProjects.length === 0 ? (
          <EmptyState
            title="현재 처리할 작업이 없습니다."
            description={
              canSeeAll
                ? "검수를 기다리는 영상이 없습니다."
                : isEditor
                  ? "현재 배정된 영상 작업이 없습니다."
                  : "현재 수정해야 할 영상이 없습니다."
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
                        ? `제출자 ${
                            v?.submittedBy?.name ?? "-"
                          }`
                        : isEditor
                          ? p.workflowStatus ===
                            "EDITOR_WORKING"
                            ? "영상 작업 진행"
                            : p.status ===
                                "REVISION_REQUESTED"
                              ? "수정 요청 확인 필요"
                              : "작업 시작 필요"
                          : `${
                              v?.feedback.length ?? 0
                            }개의 피드백 확인 필요`}
                    </p>
                  </div>

                  <Link
                    href={`/projects/${p.id}`}
                    className="btn-secondary whitespace-nowrap"
                  >
                    프로젝트 보기
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
            Project Overview
          </p>

          <Link
            href="/projects"
            className="text-sm text-brand hover:underline"
          >
            전체 보기
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <EmptyState
            title="프로젝트가 없습니다."
            description={
              isEditor
                ? "아직 배정된 프로젝트가 없습니다."
                : "첫 번째 프로젝트를 만들어 보세요."
            }
            action={
              !isEditor ? (
                <Link
                  href="/projects"
                  className="btn-primary"
                >
                  + 새 프로젝트
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
                      프로젝트
                    </th>

                    <th className="px-5 py-3 font-medium">
                      현재 버전
                    </th>

                    <th className="px-5 py-3 font-medium">
                      현재 상태
                    </th>

                    <th className="px-5 py-3 font-medium">
                      최근 수정
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
                              {STATUS_LABEL[
                                p.status
                              ] ?? p.status}
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
          최근 활동
        </p>

        {recentActivity.length === 0 ? (
          <EmptyState
            title="아직 활동 기록이 없습니다."
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
    </AppShell>
  );
}