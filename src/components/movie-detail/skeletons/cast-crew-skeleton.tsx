import { Skeleton } from "@/components/ui/skeleton";

export function CastCrewSkeleton() {
  return (
    <section className="space-y-5 rounded-xl border bg-card p-5">
      {["w-24", "w-28"].map((titleWidth, sectionIndex) => (
        <div key={sectionIndex}>
          <div className="mb-3 flex items-center gap-2">
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className={`h-5 ${titleWidth}`} />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: sectionIndex ? 8 : 2 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-20 rounded-full" />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
