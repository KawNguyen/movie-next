"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clapperboard, Play } from "lucide-react";

export function VideoPlayerSkeleton() {
  return (
    <Card className="gap-2">
      {/* ===== Header ===== */}
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {/* Left: icon + text */}
          <div className="flex items-end gap-1">
            <Clapperboard className="size-5 text-muted-foreground" />
            <Skeleton className="h-5 w-44" />
          </div>

          {/* Right: server badge */}
          <Skeleton className="h-6 w-24 rounded-full" />
        </CardTitle>
      </CardHeader>

      {/* ===== Content ===== */}
      <CardContent>
        <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
          {/* Fake video */}
          <Skeleton className="absolute inset-0 rounded-lg" />

          {/* Center overlay (giống player) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/40">
            <Play className="w-16 h-16 opacity-40 mb-4" />
            <Skeleton className="h-5 w-40 bg-white/30" />
            <Skeleton className="h-4 w-28 mt-2 bg-white/20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
