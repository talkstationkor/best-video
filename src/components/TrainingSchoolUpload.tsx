"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

type TrainingSchoolUploadProps = {
  projectId: string;
  versionNumber: number;
  existingUpload?: {
    status: string;
    trainingSchoolUrl: string | null;
    completedAt: string | Date | null;
    uploadedByName: string | null;
  } | null;
};

export default function TrainingSchoolUpload({
  projectId,
  versionNumber,
  existingUpload
}: TrainingSchoolUploadProps) {
  const router = useRouter();
  const { language } = useLanguage();

  const isEnglish = language === "English";

  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isCompleted =
    existingUpload?.status === "UPLOAD_COMPLETED";

  const completedAt = existingUpload?.completedAt
    ? new Date(existingUpload.completedAt).toLocaleString(
        isEnglish ? "en-US" : "ko-KR"
      )
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (!url.trim()) {
      setError(
        isEnglish
          ? "Please enter the Training School link."
          : "Training School 링크를 입력해주세요."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `/api/projects/${projectId}/training-school`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            trainingSchoolUrl: url.trim()
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            (isEnglish
              ? "An error occurred while completing the upload."
              : "업로드 완료 처리 중 오류가 발생했습니다.")
        );
      }

      setIsOpen(false);
      setUrl("");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEnglish
            ? "An error occurred while completing the upload."
            : "업로드 완료 처리 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEnglish
            ? "Training School Upload"
            : "Training School 업로드"}
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {isEnglish
            ? "Upload the final approved video to Training School."
            : "최종 확정된 영상을 Training School에 업로드하는 단계입니다."}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-gray-500">
              {isEnglish ? "Final Version" : "최종 버전"}
            </div>

            <div className="mt-1 text-base font-semibold text-gray-900">
              V{versionNumber}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-500">
              {isEnglish ? "Status" : "상태"}
            </div>

            <div className="mt-1">
              {isCompleted ? (
                <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  {isEnglish ? "Upload Completed" : "업로드 완료"}
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                  {isEnglish ? "Upload Required" : "업로드 필요"}
                </span>
              )}
            </div>
          </div>
        </div>

        {isCompleted ? (
          <div className="mt-5 space-y-3 border-t border-gray-200 pt-4">
            <div>
              <div className="text-xs font-medium text-gray-500">
                {isEnglish ? "Uploaded By" : "업로드 완료자"}
              </div>

              <div className="mt-1 text-sm text-gray-900">
                {existingUpload?.uploadedByName || "-"}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500">
                {isEnglish ? "Completed At" : "완료 일시"}
              </div>

              <div className="mt-1 text-sm text-gray-900">
                {completedAt || "-"}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500">
                {isEnglish
                  ? "Training School Link"
                  : "Training School 링크"}
              </div>

              <div className="mt-1">
                {existingUpload?.trainingSchoolUrl ? (
                  <a
                    href={existingUpload.trainingSchoolUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-sm text-blue-600 underline hover:text-blue-800"
                  >
                    {existingUpload.trainingSchoolUrl}
                  </a>
                ) : (
                  <span className="text-sm text-gray-500">
                    -
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {isEnglish
                ? `Training School upload for final version V${versionNumber} has been completed.`
                : `최종 버전 V${versionNumber}의 Training School 업로드가 완료되었습니다.`}
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <button
              type="button"
              onClick={() => {
                setError("");
                setIsOpen(true);
              }}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              {isEnglish ? "Complete Upload" : "업로드 완료 처리"}
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEnglish
                  ? "Complete Training School Upload"
                  : "Training School 업로드 완료 처리"}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {isEnglish
                  ? "Enter the link after completing the actual upload to Training School."
                  : "실제 Training School 업로드를 완료한 후 링크를 입력해주세요."}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {isEnglish ? "Final Version" : "최종 버전"}
                  </label>

                  <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900">
                    V{versionNumber}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="training-school-url"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {isEnglish
                      ? "Training School Link"
                      : "Training School 링크"}
                  </label>

                  <input
                    id="training-school-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!loading) {
                      setIsOpen(false);
                      setError("");
                    }
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  {isEnglish ? "Cancel" : "취소"}
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                >
                  {loading
                    ? isEnglish
                      ? "Processing..."
                      : "처리 중..."
                    : isEnglish
                      ? "Complete Upload"
                      : "업로드 완료 처리"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
