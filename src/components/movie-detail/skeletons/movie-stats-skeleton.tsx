import { Skeleton } from "@/components/ui/skeleton";

export function MovieStatsSkeleton() {
  return (
    <section className="h-full rounded-xl border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
      <dl className="divide-y">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex justify-between gap-4 py-2.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </dl>
    </section>
  );
}
