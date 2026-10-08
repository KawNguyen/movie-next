import { Skeleton } from "@/components/ui/skeleton";

export function MovieInfoSkeleton() {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="h-5 w-28" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </section>
  );
}
