export default function OpportunitiesLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 xl:px-8" aria-label="Kansen laden" aria-busy="true">
      <div className="h-3 w-28 animate-pulse rounded bg-surface-2" />
      <div className="mt-4 h-10 w-52 animate-pulse rounded bg-surface-2" />
      <div className="mt-7 h-12 w-full animate-pulse rounded-xl bg-surface-2" />
      <div className="mt-8 space-y-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex gap-4"><div className="h-11 w-11 animate-pulse rounded-full bg-surface-2" /><div className="flex-1"><div className="h-4 w-24 animate-pulse rounded bg-surface-2" /><div className="mt-3 h-6 w-2/3 animate-pulse rounded bg-surface-2" /><div className="mt-3 h-4 w-full animate-pulse rounded bg-surface-2" /></div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
