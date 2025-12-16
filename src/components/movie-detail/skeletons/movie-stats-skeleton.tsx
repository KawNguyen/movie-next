"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function MovieStatsSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Thông tin chi tiết</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-20" />
          </div>

          <Separator />

          <div className="flex justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-20" />
          </div>

          <Separator />

          <div className="flex justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Separator />

          <div className="flex justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-20" />
          </div>

          <Separator />

          <div className="flex justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-20" />
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
