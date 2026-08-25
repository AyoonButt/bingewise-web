export function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="aspect-[2/3] skeleton" />
          <div className="p-4 space-y-3">
            <div className="h-5 skeleton w-3/4 rounded" />
            <div className="space-y-1.5">
              <div className="h-3 skeleton w-full rounded" />
              <div className="h-3 skeleton w-5/6 rounded" />
            </div>
            <div className="flex gap-4 pt-2 border-t border-border">
              <div className="h-5 skeleton w-12 rounded" />
              <div className="h-5 skeleton w-12 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
