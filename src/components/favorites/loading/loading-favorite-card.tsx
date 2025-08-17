"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";

export function FavoriteMovieCardSkeleton() {
  return (
    <Card
      className="group border-1 p-0 overflow-hidden relative 
                 flex flex-col md:flex-row md:h-40"
    >
      {/* Image skeleton */}
      <CardHeader className="p-0 w-full md:w-48 flex-shrink-0">
        <AspectRatio
          ratio={2 / 3}
          className="relative overflow-hidden w-full md:aspect-[3/2] md:h-40"
        >
          <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
          <Badge className="absolute top-3 left-3 opacity-70">
            <Skeleton className="h-4 w-16" />
          </Badge>
        </AspectRatio>
      </CardHeader>

      {/* Content skeleton */}
      <CardContent
        className="p-2 sm:p-3 text-center sm:text-left 
                   md:flex-1 md:flex md:flex-col md:justify-between"
      >
        <div className="space-y-2">
          <Skeleton className="h-5 w-4/5" />
          <div className="flex items-center justify-between md:flex-col md:items-start md:gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>

      {/* Remove button skeleton */}
      <div className="absolute top-2 right-2 md:relative md:m-2 md:self-start">
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </Card>
  );
}
