import Link from "next/link";
import { getCurrentMember } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function EntryPage() {
  const member = await getCurrentMember();
  if (member) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold tracking-tight text-brand">
            BEST VIDEO
          </p>

          <h1 className="mt-3 text-2xl font-semibold text-ink">
            Video Review &amp; Approval
          </h1>

          <p className="mt-2 text-sm text-muted">
            Who are you?
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/teams/BEST_VIDEO_TEAM"
            className="card block w-full px-5 py-4 text-left transition hover:border-brand"
          >
            <div className="font-medium text-ink">
              Best Video Team
            </div>

            <div className="mt-0.5 text-sm text-muted">
              Plan, assign, review and manage videos
            </div>
          </Link>

          <Link
            href="/teams/EDITOR_TEAM"
            className="card block w-full px-5 py-4 text-left transition hover:border-brand"
          >
            <div className="font-medium text-ink">
              Editor Team
            </div>

            <div className="mt-0.5 text-sm text-muted">
              Edit videos, complete checklists and submit versions
            </div>
          </Link>

          <Link
            href="/teams/TMT"
            className="card block w-full px-5 py-4 text-left transition hover:border-brand"
          >
            <div className="font-medium text-ink">
              TMT
            </div>

            <div className="mt-0.5 text-sm text-muted">
              Review, give feedback and approve
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}