import Link from "next/link";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { permissions } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";

const TEAM_LABEL: Record<string, string> = {
  "Best Video Team": "Best Video Team",
  BEST_VIDEO_TEAM: "Best Video Team",
  EDITOR_TEAM: "Editor Team",
  TMT: "TMT"
};

function getProjectSituation(project: {
  status: string;
  workflowStatus: string;
  trainingSchoolUploads: {
    status: string;
  }[];
}) {
  const trainingSchoolCompleted =
    project.trainingSchoolUploads.some(
      (upload) => upload.status === "UPLOAD_COMPLETED"
    );

  if (trainingSchoolCompleted) {
    return {
      label: "완료",
      description: "Training School 업로드 완료",
      nextAction: "없음",
      className: "bg-green-50 text-green-700"
    };
  }

  if (
    project.workflowStatus === "FINAL_APPROVED" ||
    project.status === "FINAL_APPROVED"
  ) {
    return {
      label: "최종 승인",
      description: "최종 영상 확정",
      nextAction: "Training School 업로드",
      className: "bg-purple-50 text-purple-700"
    };
  }

  if (
    project.status === "REVISION_REQUESTED" ||
    project.status === "Revision Requested"
  ) {
    return {
      label: "수정 요청",
      description: "Best Video/TMT의 피드백 반영 필요",
      nextAction: "Editor 수정",
      className: "bg-red-50 text-red-700"
    };
  }

  if (
    project.workflowStatus === "EDITOR_WORKING" ||
    project.workflowStatus === "Editor working"
  ) {
    return {
      label: "Editor 수정 중",
      description: "영상 작업 진행 중",
      nextAction: "Editor 작업 완료",
      className: "bg-blue-50 text-blue-700"
    };
  }

  if (
    project.workflowStatus === "BEST_VIDEO_REVIEW" ||
    project.workflowStatus === "Best Video review"
  ) {
    return {
      label: "Best Video 검토 중",
      description: "Best Video Team 검토 단계",
      nextAction: "검토 또는 수정 요청",
      className: "bg-yellow-50 text-yellow-700"
    };
  }

  if (
    project.workflowStatus === "OUR_TEAM_REVIEW" ||
    project.workflowStatus === "Our Team review"
  ) {
    return {
      label: "TMT 검토 중",
      description: "TMT 검토 단계",
      nextAction: "승인 또는 수정 요청",
      className: "bg-orange-50 text-orange-700"
    };
  }

  return {
    label: "진행 중",
    description: "프로젝트 진행 중",
    nextAction: "확인 필요",
    className: "bg-gray-50 text-gray-700"
  };
}

export default async function ProjectsPage() {
  const member = await getCurrentMember();

  if (!member) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-gray-200 bg-white p-8">
          <h1 className="text-xl font-semibold text-gray-900">
            Projects
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            먼저 로그인할 사용자를 선택해주세요.
          </p>
        </div>
      </AppShell>
    );
  }

  const canViewAll = permissions.canViewAllProjects(member);

  const projects = await prisma.project.findMany({
    where: canViewAll
      ? undefined
      : {
          OR: [
            { team: member.team },
            { assignedEditorId: member.id },
            { createdById: member.id }
          ]
        },

    include: {
      createdBy: {
        select: {
          id: true,
          name: true
        }
      },

      assignedEditor: {
        select: {
          id: true,
          name: true
        }
      },

      trainingSchoolUploads: {
        select: {
          status: true,
          updatedAt: true
        },
        orderBy: {
          updatedAt: "desc"
        }
      },

      versions: {
        orderBy: {
          versionNumber: "desc"
        },
        take: 1,

        select: {
          id: true,
          versionNumber: true,

          submittedBy: {
            select: {
              name: true
            }
          },

          feedback: {
            select: {
              id: true
            }
          }
        }
      }
    },

    orderBy: {
      updatedAt: "desc"
    }
  });

  return (
    <AppShell wide>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Projects
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            전체 프로젝트의 현재 진행 상황과 다음 액션을 확인할 수 있습니다.
          </p>
        </div>

        <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full table-fixed text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="w-[13%] whitespace-nowrap px-4 py-3 text-center font-semibold text-gray-700">
                  Project
                </th>

                <th className="w-[10%] whitespace-nowrap px-3 py-3 text-center font-semibold text-gray-700">
                  Team
                </th>

                <th className="w-[5%] whitespace-nowrap px-2 py-3 text-center font-semibold text-gray-700">
                  Version
                </th>

                <th className="w-[13%] whitespace-nowrap px-3 py-3 text-center font-semibold text-gray-700">
                  현재 상황
                </th>

                <th className="w-[5%] whitespace-nowrap px-2 py-3 text-center font-semibold text-gray-700">
                  피드백
                </th>

                <th className="w-[13%] whitespace-nowrap px-3 py-3 text-center font-semibold text-gray-700">
                  다음 액션
                </th>

                <th className="w-[8%] whitespace-nowrap px-3 py-3 text-center font-semibold text-gray-700">
                  담당 Editor
                </th>

                <th className="w-[8%] whitespace-nowrap px-3 py-3 text-center font-semibold text-gray-700">
                  Status
                </th>

                <th className="w-[10%] whitespace-nowrap px-3 py-3 text-center font-semibold text-gray-700">
                  Submitted By
                </th>

                <th className="w-[6%] whitespace-nowrap px-3 py-3 text-center font-semibold text-gray-700">
                  Updated
                </th>

                <th className="w-[9%] whitespace-nowrap px-3 py-3 text-center font-semibold text-gray-700">
                  Training School
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {projects.map((project) => {
                const latestVersion = project.versions[0];

                const situation = getProjectSituation(project);

                const feedbackCount =
                  latestVersion?.feedback.length ?? 0;

                const trainingSchoolUpload =
                  project.trainingSchoolUploads[0];

                const isFinalApproved =
                  project.workflowStatus === "FINAL_APPROVED" ||
                  project.status === "FINAL_APPROVED";

                return (
                  <tr
                    key={project.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-4 align-top">
                      <Link
                        href={`/projects/${project.id}`}
                        className="block break-words font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {project.projectName}
                      </Link>

                      {project.details && (
                        <div className="mt-1 line-clamp-2 break-words text-xs text-gray-500">
                          {project.details}
                        </div>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-3 py-4 align-top text-gray-600">
                      {TEAM_LABEL[project.team] ?? project.team}
                    </td>

                    <td className="whitespace-nowrap px-2 py-4 text-center align-top font-medium text-gray-900">
                      {latestVersion
                        ? `V${latestVersion.versionNumber}`
                        : "-"}
                    </td>

                    <td className="px-3 py-4 align-top">
                      <div
                        className={`inline-flex max-w-full rounded-lg px-2.5 py-1 text-xs font-semibold ${situation.className}`}
                      >
                        <span className="whitespace-nowrap">
                          {situation.label}
                        </span>
                      </div>

                      <div className="mt-1 break-words text-xs leading-5 text-gray-500">
                        {situation.description}
                      </div>
                    </td>

                    <td className="px-2 py-4 text-center align-top">
                      {feedbackCount > 0 ? (
                        <span className="inline-flex min-w-7 justify-center rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                          {feedbackCount}
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          -
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-4 align-top">
                      <span className="break-words text-xs font-medium leading-5 text-gray-700">
                        {situation.nextAction}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-3 py-4 align-top text-gray-700">
                      {project.assignedEditor?.name ?? "-"}
                    </td>

                    <td className="whitespace-nowrap px-3 py-4 text-center align-top">
                      <StatusBadge status={project.status} />
                    </td>

                    <td className="whitespace-nowrap px-3 py-4 text-center align-top text-gray-600">
                      {latestVersion?.submittedBy.name ??
                        project.createdBy.name}
                    </td>

                    <td className="whitespace-nowrap px-3 py-4 text-center align-top text-xs text-gray-500">
                      {formatDateTime(project.updatedAt)}
                    </td>

                    <td className="px-3 py-4 text-center align-top">
                      {!isFinalApproved ? (
                        <span className="whitespace-nowrap text-gray-400">
                          -
                        </span>
                      ) : trainingSchoolUpload?.status ===
                        "UPLOAD_COMPLETED" ? (
                        <span className="inline-flex whitespace-nowrap rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                          업로드 완료
                        </span>
                      ) : (
                        <span className="inline-flex whitespace-nowrap rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                          업로드 필요
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {projects.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    표시할 프로젝트가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}