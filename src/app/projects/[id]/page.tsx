import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell, { requireMember } from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import VideoPlayer from "@/components/VideoPlayer";
import ProjectActions from "@/components/ProjectActions";
import AddFeedbackButton from "@/components/AddFeedbackButton";
import FeedbackItem from "@/components/FeedbackItem";
import AssignedEditorSelect from "@/components/AssignedEditorSelect";
import TrainingSchoolUpload from "@/components/TrainingSchoolUpload";
import ProjectText from "@/components/ProjectText";
import { prisma } from "@/lib/db";
import { permissions } from "@/lib/permissions";
import { formatDate, formatDateTime } from "@/lib/format";

const TEAM_LABEL: Record<string, string> = {
  BEST_VIDEO_TEAM: "Best Video Team",
  "Best Video Team": "Best Video Team",
  TMT: "TMT",
  EDITOR_TEAM: "Editor Team"
};

const STATUS_LABEL: Record<string, { ko: string; en: string }> = {
  DRAFT: {
    ko: "작업 준비",
    en: "Draft"
  },
  REVIEW_REQUIRED: {
    ko: "검수 대기",
    en: "Review Required"
  },
  REVISION_REQUESTED: {
    ko: "수정 요청",
    en: "Revision Requested"
  },
  APPROVED: {
    ko: "승인 완료",
    en: "Approved"
  },
  FINAL_APPROVED: {
    ko: "최종 승인 완료",
    en: "Final Approved"
  }
};

export default async function ProjectDetailPage({
  params
}: {
  params: { id: string };
}) {
  const member = await requireMember();

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      createdBy: {
        select: {
          name: true
        }
      },

      assignedEditor: {
        select: {
          id: true,
          name: true,
          team: true,
          role: true,
          isActive: true
        }
      },

      finalVersion: {
        select: {
          id: true,
          versionNumber: true,
          videoUrl: true
        }
      },

      trainingSchoolUploads: {
        orderBy: {
          createdAt: "desc"
        },
        include: {
          uploadedBy: {
            select: {
              name: true
            }
          },
          version: {
            select: {
              versionNumber: true
            }
          }
        }
      },

      versions: {
        orderBy: {
          versionNumber: "desc"
        },
        include: {
          submittedBy: {
            select: {
              name: true
            }
          },

          approvedBy: {
            select: {
              name: true
            }
          },

          feedback: {
            orderBy: {
              createdAt: "asc"
            },
            include: {
              author: {
                select: {
                  name: true
                }
              },
              resolvedBy: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!project) {
    notFound();
  }

  if (
    !permissions.canViewAllProjects(member) &&
    project.team !== member.team
  ) {
    notFound();
  }

  const editors = await prisma.member.findMany({
    where: {
      team: "EDITOR_TEAM",
      role: "EDITOR",
      isActive: true
    },
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: "asc"
    }
  });

  const current = project.versions[0];

  if (!current) {
    notFound();
  }

  const olderVersions = project.versions.slice(1);

  const trainingSchoolUpload =
    project.trainingSchoolUploads[0] ?? null;

  const finalVersion = project.finalVersion;

  const openFeedbackCount = current.feedback.filter(
    (f) => f.status === "OPEN"
  ).length;

  const isFinalApproved =
    project.workflowStatus === "FINAL_APPROVED" ||
    project.finalVersionId !== null ||
    finalVersion !== null;

  const isCurrentPending =
    current.status !== "APPROVED" && !isFinalApproved;

  const statusLabel =
    STATUS_LABEL[project.workflowStatus] ??
    STATUS_LABEL[project.status] ?? {
      ko: project.status,
      en: project.status
    };

  const canReview =
    permissions.canAddFeedback(member) &&
    isCurrentPending;

  const canSubmit =
    permissions.canSubmitVersion(member) &&
    (permissions.canViewAllProjects(member) ||
      project.team === member.team) &&
    !isFinalApproved;

  const needsMyAction =
    !isFinalApproved &&
    project.status !== "APPROVED" &&
    (permissions.canViewAllProjects(member) ||
      project.team === member.team);

  const canAssignEditor =
    permissions.canAssignEditor(member);

  return (
    <AppShell>
      <Link
        href="/projects"
        className="text-sm font-medium text-muted hover:text-brand"
      >
        ← <ProjectText ko="프로젝트 목록" en="Projects" />
      </Link>

      {/* Header */}
      <div className="mt-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="label-eyebrow">
              <ProjectText ko="프로젝트" en="PROJECT" />
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
              {project.projectName}
            </h1>

            <p className="mt-2 text-sm text-muted">
              {TEAM_LABEL[project.team] ?? project.team} ·{" "}
              {project.createdBy.name} ·{" "}
              {formatDate(project.createdAt)}{" "}
              <ProjectText ko="생성" en="created" />
            </p>
          </div>

          <Link
            href="/projects"
            className="btn-secondary w-fit"
          >
            <ProjectText ko="프로젝트 목록" en="Projects" />
          </Link>
        </div>

        {project.details && (
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
            {project.details}
          </p>
        )}
      </div>

      {/* Current Overview */}
      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card px-5 py-4">
          <p className="label-eyebrow">
            <ProjectText ko="현재 상태" en="Current Status" />
          </p>

          <div className="mt-2 flex items-center gap-2">
            <StatusBadge
              status={
                isFinalApproved
                  ? "FINAL_APPROVED"
                  : project.status
              }
            />
          </div>

          <p className="mt-2 text-sm font-medium text-ink">
            <ProjectText
              ko={statusLabel.ko}
              en={statusLabel.en}
            />
          </p>
        </div>

        <div className="card px-5 py-4">
          <p className="label-eyebrow">
            <ProjectText ko="현재 버전" en="Current Version" />
          </p>

          <p className="mt-2 text-2xl font-semibold text-ink">
            V{current.versionNumber}
          </p>

          <p className="mt-1 text-xs text-muted">
            <ProjectText
              ko={isFinalApproved ? "최종 확정 버전" : "최신 제출 버전"}
              en={isFinalApproved ? "Final approved version" : "Latest submitted version"}
            />
          </p>
        </div>

        <div className="card px-5 py-4">
          <p className="label-eyebrow">
            <ProjectText ko="미해결 피드백" en="Open Feedback" />
          </p>

          <p className="mt-2 text-2xl font-semibold text-ink">
            {openFeedbackCount}
          </p>

          <p className="mt-1 text-xs text-muted">
            <ProjectText
              ko="현재 버전 기준"
              en="For current version"
            />
          </p>
        </div>

        <div className="card px-5 py-4">
          <p className="label-eyebrow">
            <ProjectText ko="마지막 수정" en="Last Updated" />
          </p>

          <p className="mt-2 text-sm font-medium text-ink">
            {formatDateTime(project.updatedAt)}
          </p>

          <p className="mt-1 text-xs text-muted">
            <ProjectText
              ko="프로젝트 기준"
              en="Project"
            />
          </p>
        </div>
      </section>

      {/* Assigned Editor */}
      {canAssignEditor && !isFinalApproved && (
        <section className="card mt-6 px-6 py-5">
          <div className="mb-4">
            <p className="label-eyebrow">
              <ProjectText
                ko="EDITOR 배정"
                en="EDITOR ASSIGNMENT"
              />
            </p>

            <h2 className="mt-1 text-xl font-semibold text-ink">
              <ProjectText
                ko="담당 Editor"
                en="Assigned Editor"
              />
            </h2>

            <p className="mt-1 text-sm text-muted">
              <ProjectText
                ko="이 프로젝트를 작업할 Editor를 지정할 수 있습니다."
                en="You can assign an Editor to work on this project."
              />
            </p>
          </div>

          <AssignedEditorSelect
            projectId={project.id}
            currentEditorId={project.assignedEditor?.id ?? null}
            currentEditorName={project.assignedEditor?.name ?? null}
            editors={editors}
          />
        </section>
      )}

      {/* My Action */}
      {needsMyAction && (
        <section className="mt-6 rounded-lg border border-brand/20 bg-blue-50 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="label-eyebrow text-brand">
                <ProjectText
                  ko="지금 내가 해야 할 일"
                  en="My Action"
                />
              </p>

              <h2 className="mt-1 text-lg font-semibold text-ink">
                <ProjectText
                  ko={
                    permissions.canViewAllProjects(member)
                      ? "현재 영상을 검수해 주세요."
                      : "현재 버전을 확인하고 작업을 진행해 주세요."
                  }
                  en={
                    permissions.canViewAllProjects(member)
                      ? "Please review the current video."
                      : "Please review the current version and continue the work."
                  }
                />
              </h2>

              <p className="mt-1 text-sm text-muted">
                V{current.versionNumber} ·{" "}
                <ProjectText
                  ko={statusLabel.ko}
                  en={statusLabel.en}
                />
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {canReview && (
                <a
                  href="#feedback"
                  className="btn-secondary"
                >
                  <ProjectText
                    ko="피드백 남기기"
                    en="Leave Feedback"
                  />
                </a>
              )}

              {canSubmit && (
                <a
                  href="#actions"
                  className="btn-primary"
                >
                  <ProjectText
                    ko="다음 작업 진행"
                    en="Continue to Next Action"
                  />
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Current Version */}
      <section className="card mt-6 overflow-hidden">
        <div className="border-b border-line px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="label-eyebrow">
                <ProjectText
                  ko="현재 버전"
                  en="CURRENT VERSION"
                />
              </p>

              <h2 className="mt-1 text-xl font-semibold text-ink">
                V{current.versionNumber}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge
                status={
                  isFinalApproved
                    ? "APPROVED"
                    : current.status
                }
              />

              {current.submittedAt && (
                <span className="text-xs text-muted">
                  {formatDateTime(current.submittedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <VideoPlayer
            videoUrl={current.videoUrl}
            label={`V${current.versionNumber} `}
          />

          {isFinalApproved && (
            <div className="mt-5 rounded-md bg-green-50 px-4 py-3 text-sm">
              <p className="font-medium text-green-700">
                <ProjectText
                  ko="최종 승인된 버전입니다."
                  en="This version has been finally approved."
                />
              </p>

              <p className="mt-1 text-green-700/80">
                {finalVersion
                  ? `V${finalVersion.versionNumber}`
                  : `V${current.versionNumber}`}
                {" · "}
                <ProjectText
                  ko="최종 버전"
                  en="Final Version"
                />
                {current.approvedBy?.name
                  ? ` · ${current.approvedBy.name} `
                  : ""}
                {current.approvedBy?.name && (
                  <ProjectText
                    ko="승인"
                    en="approved"
                  />
                )}
                {project.approvedAt
                  ? ` · ${formatDateTime(project.approvedAt)}`
                  : ""}
              </p>
            </div>
          )}

          <div id="actions" className="mt-6">
            {isCurrentPending ? (
              <ProjectActions
                projectId={project.id}
                currentVersionId={current.id}
                currentVersionNumber={current.versionNumber}
                openFeedbackCount={openFeedbackCount}
                canSubmitVersion={canSubmit}
                canRequestRevision={permissions.canRequestRevision(member)}
                canApprove={permissions.canApprove(member)}
                isApproved={false}
              />
            ) : (
              <div className="rounded-md border border-line bg-paper px-4 py-3 text-sm text-muted">
                <ProjectText
                  ko="이 프로젝트는 최종 승인되어 추가 검수나 버전 작업이 필요하지 않습니다."
                  en="This project has been finally approved and requires no further review or version work."
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Training School */}
      {(project.status === "APPROVED" ||
        project.workflowStatus === "FINAL_APPROVED" ||
        project.finalVersionId) && (
        <TrainingSchoolUpload
          projectId={project.id}
          versionNumber={current.versionNumber}
          existingUpload={
            trainingSchoolUpload
              ? {
                  status: trainingSchoolUpload.status,
                  trainingSchoolUrl:
                    trainingSchoolUpload.trainingSchoolUrl,
                  completedAt:
                    trainingSchoolUpload.completedAt,
                  uploadedByName:
                    trainingSchoolUpload.uploadedBy?.name ?? null
                }
              : null
          }
        />
      )}

      {/* Current Feedback */}
      <section id="feedback" className="mt-8">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label-eyebrow">
              <ProjectText
                ko="현재 버전 피드백"
                en="CURRENT VERSION FEEDBACK"
              />
            </p>

            <h2 className="mt-1 text-xl font-semibold text-ink">
              V{current.versionNumber}{" "}
              <ProjectText ko="피드백" en="Feedback" />
            </h2>
          </div>

          <AddFeedbackButton
            versionId={current.id}
            canAdd={canReview}
          />
        </div>

        {current.feedback.length === 0 ? (
          <div className="card px-6 py-8 text-center">
            <p className="text-sm font-medium text-ink">
              <ProjectText
                ko="등록된 피드백이 없습니다."
                en="There is no feedback yet."
              />
            </p>

            <p className="mt-1 text-xs text-muted">
              <ProjectText
                ko="현재 버전에 대한 검수 의견이 생기면 이곳에 표시됩니다."
                en="Review comments for the current version will appear here."
              />
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {current.feedback.map((f) => (
              <FeedbackItem
                key={f.id}
                feedback={{
                  id: f.id,
                  message: f.message,
                  timestamp: f.timestamp,
                  status: f.status,
                  createdAt: f.createdAt.toISOString(),
                  author: f.author,
                  resolvedBy: f.resolvedBy
                }}
                canResolve={permissions.canResolveFeedback(member)}
                canEditOrDelete={permissions.canEditOrDeleteFeedback(
                  member,
                  f.authorId
                )}
              />
            ))}
          </div>
        )}
      </section>

      {/* Version History */}
      <section className="mt-8">
        <div className="mb-3">
          <p className="label-eyebrow">
            <ProjectText
              ko="버전 히스토리"
              en="VERSION HISTORY"
            />
          </p>

          <h2 className="mt-1 text-xl font-semibold text-ink">
            <ProjectText
              ko="버전 히스토리"
              en="Version History"
            />
          </h2>

          <p className="mt-1 text-sm text-muted">
            <ProjectText
              ko="V1부터 현재 버전까지 모든 작업 이력을 확인할 수 있습니다."
              en="View the complete work history from V1 to the current version."
            />
          </p>
        </div>

        {olderVersions.length === 0 ? (
          <div className="card px-6 py-8 text-center text-sm text-muted">
            <ProjectText
              ko="이전 버전이 없습니다. 현재 버전이 첫 번째 버전입니다."
              en="There are no previous versions. This is the first version."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {olderVersions.map((v) => (
              <details
                key={v.id}
                className="card overflow-hidden"
              >
                <summary className="cursor-pointer list-none px-6 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-semibold text-ink">
                        V{v.versionNumber}
                      </span>

                      <StatusBadge status={v.status} />
                    </div>

                    <span className="text-xs text-muted">
                      {formatDate(v.submittedAt)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-muted">
                    <ProjectText
                      ko="제출자"
                      en="Submitted by"
                    />{" "}
                    {v.submittedBy.name}
                    {v.approvedBy ? (
                      <>
                        {" · "}
                        <ProjectText
                          ko="승인자"
                          en="Approved by"
                        />{" "}
                        {v.approvedBy.name}
                      </>
                    ) : null}
                    {v.feedback.length > 0 ? (
                      <>
                        {" · "}
                        <ProjectText
                          ko="피드백"
                          en="Feedback"
                        />{" "}
                        {v.feedback.length}
                        <ProjectText
                          ko="건"
                          en=" items"
                        />
                      </>
                    ) : null}
                  </p>
                </summary>

                <div className="border-t border-line bg-paper px-6 py-5">
                  <VideoPlayer
                    videoUrl={v.videoUrl}
                    label={`V${v.versionNumber}`}
                  />

                  {v.feedback.length > 0 && (
                    <div className="mt-5">
                      <p className="text-sm font-semibold text-ink">
                        <ProjectText
                          ko="피드백"
                          en="Feedback"
                        />{" "}
                        {v.feedback.length}
                        <ProjectText
                          ko="건"
                          en=" items"
                        />
                      </p>

                      <div className="mt-3 space-y-2">
                        {v.feedback.map((f) => (
                          <div
                            key={f.id}
                            className="rounded-md border border-line bg-panel px-4 py-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-medium text-ink">
                                {f.author.name}
                              </span>

                              <span className="text-xs text-muted">
                                {formatDateTime(f.createdAt)}
                              </span>
                            </div>

                            <p className="mt-2 text-sm leading-6 text-ink">
                              {f.message}
                            </p>

                            {f.timestamp && (
                              <p className="mt-2 text-xs font-medium text-brand">
                                <ProjectText
                                  ko="영상 위치"
                                  en="Video position"
                                />{" "}
                                {f.timestamp}
                              </p>
                            )}

                            <p className="mt-2 text-xs text-muted">
                              <ProjectText
                                ko="상태"
                                en="Status"
                              />
                              :{" "}
                              <ProjectText
                                ko={
                                  f.status === "RESOLVED"
                                    ? "해결"
                                    : "미해결"
                                }
                                en={
                                  f.status === "RESOLVED"
                                    ? "Resolved"
                                    : "Open"
                                }
                              />
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      {/* Project Information */}
      <section className="mt-8 mb-6">
        <div className="mb-3">
          <p className="label-eyebrow">
            <ProjectText
              ko="프로젝트 정보"
              en="PROJECT INFORMATION"
            />
          </p>

          <h2 className="mt-1 text-xl font-semibold text-ink">
            <ProjectText
              ko="프로젝트 정보"
              en="Project Information"
            />
          </h2>
        </div>

        <div className="card grid grid-cols-1 gap-5 px-6 py-5 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="text-xs text-muted">
              <ProjectText ko="생성자" en="Created By" />
            </p>

            <p className="mt-1 font-medium text-ink">
              {project.createdBy.name}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted">
              <ProjectText
                ko="담당 Editor"
                en="Assigned Editor"
              />
            </p>

            <p className="mt-1 font-medium text-ink">
              {project.assignedEditor?.name ?? (
                <ProjectText
                  ko="미배정"
                  en="Unassigned"
                />
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted">
              <ProjectText ko="팀" en="Team" />
            </p>

            <p className="mt-1 font-medium text-ink">
              {TEAM_LABEL[project.team] ?? project.team}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted">
              <ProjectText ko="생성일" en="Created At" />
            </p>

            <p className="mt-1 font-medium text-ink">
              {formatDateTime(project.createdAt)}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted">
              <ProjectText
                ko="마지막 수정"
                en="Last Updated"
              />
            </p>

            <p className="mt-1 font-medium text-ink">
              {formatDateTime(project.updatedAt)}
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}