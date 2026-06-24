"use client";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md rounded-lg border border-border bg-card p-6 shadow-soft">
        <p className="text-sm font-medium text-warning">Runtime error</p>
        <h1 className="mt-2 text-2xl font-semibold">Something failed</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {error.message || "The request could not be completed."}
        </p>
        <button
          className="mt-6 h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
