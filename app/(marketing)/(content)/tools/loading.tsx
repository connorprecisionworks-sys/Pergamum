import { Skeleton } from "@/components/ui/skeleton";

function ToolCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-md shrink-0" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

export default function ToolsLoading() {
  return (
    <div className="container py-8">
      <Skeleton className="h-8 w-40 mb-2" />
      <Skeleton className="h-4 w-64 mb-8" />

      {Array.from({ length: 3 }).map((_, section) => (
        <div key={section} className="mb-10">
          <Skeleton className="h-5 w-24 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <ToolCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
