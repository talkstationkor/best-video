"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="text-lg font-medium text-ink">Something went wrong.</p>
          <p className="mt-1 text-sm text-muted">Please try again.</p>
          <button onClick={reset} className="btn-primary mt-6">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
