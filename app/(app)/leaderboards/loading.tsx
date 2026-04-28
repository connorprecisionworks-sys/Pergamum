import { Skeleton } from "@/components/ui/skeleton";

function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3">
      <Skeleton className="h-6 w-6 shrink-0" />
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-14" />
    </div>
  );
}

export default function LeaderboardsLoading() {
  return (
    <div className="container py-8 max-w-3xl">
      <Skeleton className="h-8 w-40 mb-2" />
      <Skeleton className="h-4 w-64 mb-6" />

      <div className="flex gap-2 mb-6">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      <div className="rounded-lg border bg-card divide-y">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="px-4">
            <LeaderboardRowSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}
