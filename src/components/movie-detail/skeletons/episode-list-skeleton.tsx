import { Skeleton } from "@/components/ui/skeleton";

export function EpisodeListSkeleton() {
  return (
    <aside className="flex min-h-0 flex-col rounded-xl border bg-card lg:h-full">
      <div className="space-y-2 px-4 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-12" />
        <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-lg bg-muted p-1">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      </div>
      <div className="mt-3 h-72 shrink-0 p-4 lg:h-auto lg:min-h-0 lg:flex-1">
        <div className="grid grid-cols-5 content-start gap-2 sm:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 24 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
        </div>
      </div>
    </aside>
  );
}
