import { Skeleton } from "@/components/ui/skeleton";

export function VideoPlayerSkeleton() {
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Skeleton className="size-5 shrink-0 rounded-full" />
          <Skeleton className="h-5 w-44" />
        </div>
        <Skeleton className="h-6 w-24 shrink-0 rounded-full" />
      </header>
      <div className="relative aspect-video bg-black">
        <Skeleton className="absolute inset-0 rounded-none bg-muted/30" />
      </div>
    </section>
  );
}
