"use client";

import Link from "next/link";
import { useEffect } from "react";

type Project = {
  id: string;
  projectName: string;
  currentVersion: number;
  status: string;
  updatedAt: string;
};

type Props = {
  title: string;
  projects: Project[];
  onClose: () => void;
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "작업 준비",
  REVIEW_REQUIRED: "검수 대기",
  REVISION_REQUESTED: "수정 요청",
  APPROVED: "승인",
  WORKING: "작업 중"
};

export default function DashboardProjectModal({
  title,
  projects,
  onClose
}: Props) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-line bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <p className="label-eyebrow">PROJECT LIST</p>

            <h2 className="mt-1 text-xl font-semibold text-ink">
              {title}
            </h2>

            <p className="mt-1 text-sm text-muted">
              총 {projects.length}개의 프로젝트
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-secondary h-9 px-3"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto">
          {projects.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-ink">
                해당 프로젝트가 없습니다.
              </p>

              <p className="mt-1 text-sm text-muted">
                선택한 조건에 해당하는 프로젝트가 없습니다.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="px-6 py-4 transition hover:bg-paper/60"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <Link
                        href={"/projects/" + project.id}
                        onClick={onClose}
                        className="font-medium text-ink hover:text-brand hover:underline"
                      >
                        {project.projectName}
                      </Link>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                        <span>V{project.currentVersion}</span>

                        <span>
                          {STATUS_LABEL[project.status] ?? project.status}
                        </span>

                        <span>
                          최근 수정{" "}
                          {new Date(project.updatedAt).toLocaleDateString(
                            "ko-KR"
                          )}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={"/projects/" + project.id}
                      onClick={onClose}
                      className="btn-secondary w-fit whitespace-nowrap"
                    >
                      프로젝트 보기
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
