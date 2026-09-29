import AppShell, { requireMember } from "@/components/AppShell";

import { prisma } from "@/lib/db";

import { permissions } from "@/lib/permissions";

import DashboardContent from "./DashboardContent";

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

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

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
      : { OR: [{ team: member.team }, { assignedEditorId: member.id }] };

  /*
   * 최근 12개월 월별 통계
   *
   * 기준:
   * 프로젝트 생성일
   *
   * 각 월에 생성된 프로젝트 중
   * 현재 상태가 무엇인지 집계합니다.
   *
   * 월·상태별로 따로 count하지 않고 12개월치 프로젝트를
   * 한 번에 읽어 메모리에서 집계합니다. (DB 왕복 60여 회 → 1회)
   */

  const now = new Date();

  const monthRanges = Array.from(
    { length: 12 },
    (_, index) => {
      const start = new Date(
        now.getFullYear(),
        now.getMonth() - (11 - index),
        1
      );

      return {
        key: monthKey(start),
        label: `${start.getFullYear()}년 ${
          MONTH_LABEL[start.getMonth()]
        }`
      };
    }
  );

  const firstMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() - 11,
    1
  );

  const [statusCounts, yearProjects] = await Promise.all([
    prisma.project.groupBy({
      by: ["status"],
      where: projectScope,
      _count: { _all: true }
    }),

    prisma.project.findMany({
      where: {
        ...projectScope,
        createdAt: {
          gte: firstMonthStart
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
        createdAt: true,
        updatedAt: true,

        assignedEditor: {
          select: {
            name: true
          }
        }
      }
    })
  ]);

  const countByStatus = (status: string) =>
    statusCounts.find((c) => c.status === status)?._count
      ._all ?? 0;

  const total = statusCounts.reduce(
    (sum, c) => sum + c._count._all,
    0
  );
  const reviewRequired = countByStatus("REVIEW_REQUIRED");
  const revisionRequested = countByStatus("REVISION_REQUESTED");
  const approved = countByStatus("APPROVED");

  /*
   * 월별 프로젝트 목록
   *
   * 숫자를 클릭했을 때 팝업에 표시하기 위한 데이터입니다.
   */

  const monthlyProjects: Record<
    string,
    DashboardProject[]
  > = Object.fromEntries(
    monthRanges.map((range) => [range.key, []])
  );

  for (const project of yearProjects) {
    monthlyProjects[monthKey(project.createdAt)]?.push({
      id: project.id,
      projectName: project.projectName,
      currentVersion: project.currentVersion,
      status: project.status,
      updatedAt: project.updatedAt.toISOString(),
      assignedEditor: project.assignedEditor
    });
  }

  const monthlyStats: MonthlyStat[] = monthRanges.map(
    (range) => {
      const projects = monthlyProjects[range.key];
      const countOf = (status: string) =>
        projects.filter((p) => p.status === status).length;

      return {
        key: range.key,
        label: range.label,
        total: projects.length,
        reviewRequired: countOf("REVIEW_REQUIRED"),
        revisionRequested: countOf("REVISION_REQUESTED"),
        approved: countOf("APPROVED")
      };
    }
  );

  /*
   * 내가 처리해야 할 프로젝트
   */

  const actionProjectsQuery = prisma.project.findMany({
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

  /*
   * 최근 프로젝트
   */

  const recentProjectsQuery =
    prisma.project.findMany({
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

  /*
   * 최근 활동
   */

  const recentActivityQuery =
    prisma.activityLog.findMany({
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

  const [actionProjects, recentProjects, recentActivity] =
    await Promise.all([
      actionProjectsQuery,
      recentProjectsQuery,
      recentActivityQuery
    ]);


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
      <DashboardContent
        memberName={member.name}
        canSeeAll={canSeeAll}
        isEditor={isEditor}
        stats={stats}
        monthlyStats={monthlyStats}
        monthlyProjects={monthlyProjects}
        actionProjects={actionProjects}
        recentProjects={recentProjects}
        recentActivity={recentActivity}
      />
    </AppShell>
  );
}