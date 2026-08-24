export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-calcite-light bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-10 flex flex-col gap-3">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-9 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
        <div className="rounded-2xl border border-calcite-light bg-card p-6">
          <div className="flex gap-1 rounded-2xl bg-muted/50 p-1.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 flex-1 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-3">
            <div className="h-32 animate-pulse rounded-xl bg-muted" />
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </main>
    </div>
  );
}