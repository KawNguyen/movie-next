import { Skeleton } from "@/components/ui/skeleton";

export function MovieHeroSkeleton() {
  return (
    <div className="relative h-[600px] overflow-hidden">
      {/* Background skeleton */}
      <Skeleton className="absolute inset-0 w-full h-full" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 h-full flex items-end">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8 w-full">
          {/* Poster skeleton */}
          <div className="flex justify-center md:justify-start">
            <Skeleton className="w-[250px] h-[375px] rounded-lg" />
          </div>

          {/* Info skeleton */}
          <div className="text-white space-y-4">
            {/* Title */}
            <Skeleton className="h-12 w-3/4 bg-white/20" />
            <Skeleton className="h-6 w-1/2 bg-white/20" />

            {/* Description */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-white/20" />
              <Skeleton className="h-4 w-full bg-white/20" />
              <Skeleton className="h-4 w-3/4 bg-white/20" />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16 bg-white/20" />
              <Skeleton className="h-6 w-20 bg-white/20" />
              <Skeleton className="h-6 w-18 bg-white/20" />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Skeleton className="h-10 w-32 bg-white/20" />
              <Skeleton className="h-10 w-24 bg-white/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
