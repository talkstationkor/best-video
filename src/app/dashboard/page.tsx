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

  /*
   * 내가 처리해야 할 프로젝트
   */

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

  /*
   * 최근 프로젝트
   */

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

  /*
   * 최근 활동
   */

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
      <DashboardContent
        memberName={member.name}
        hour={hour}
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