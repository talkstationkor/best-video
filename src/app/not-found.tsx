import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-lg font-medium text-ink">Project not found.</p>
      <p className="mt-1 text-sm text-muted">It may have been moved, or you may not have access to it.</p>
      <Link href="/dashboard" className="btn-primary mt-6 inline-block">
        Back to Dashboard
      </Link>
    </main>
  );
}
