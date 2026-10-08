import { Skeleton } from "@/components/ui/skeleton";

export function MovieHeroSkeleton() {
  return (
    <header>
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[300px_minmax(0,1fr)]">
        <div className="flex justify-center md:justify-start">
          <Skeleton className="h-[300px] w-[200px] rounded-xl md:h-[450px] md:w-[300px]" />
        </div>
        <div className="space-y-4 text-center md:text-left">
          <div className="space-y-2">
            <Skeleton className="mx-auto h-10 w-3/4 md:mx-0 md:h-12" />
            <Skeleton className="mx-auto h-6 w-1/2 md:mx-0" />
          </div>
          <div className="flex flex-wrap justify-center gap-2 md:justify-start">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex flex-wrap justify-center gap-2 md:justify-start">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
          <div className="flex items-center justify-center gap-3 md:justify-start">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
    </header>
  );
}
