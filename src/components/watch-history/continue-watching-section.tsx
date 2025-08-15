"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Play } from "lucide-react";
import { getContinueWatchingList } from "@/actions/watch-events";
import Image from "next/image";
import Link from "next/link";
import type { WatchHistory } from "@prisma/client";

export function ContinueWatchingSection() {
  const [continueWatching, setContinueWatching] = useState<WatchHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContinueWatching = async () => {
      try {
        const result = await getContinueWatchingList(6); // Lấy 6 phim
        if (result.success) {
          setContinueWatching(result.data);
        }
      } catch (error) {
        console.error("Error fetching continue watching:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContinueWatching();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tiếp tục xem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-gray-300 rounded-lg mb-2"></div>
                <div className="h-4 bg-gray-300 rounded mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (continueWatching.length === 0) {
    return null; // Không hiển thị gì nếu không có phim đang xem
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Tiếp tục xem ({continueWatching.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {continueWatching.map((item) => {
            const progressPercent =
              item.duration > 0
                ? Math.round((item.progress / item.duration) * 100)
                : 0;

            const episodeUrl = item.episodeId
              ? `/phim/${item.movieSlug}?tap=${item.episodeId}`
              : `/phim/${item.movieSlug}`;

            return (
              <Link key={item.id} href={episodeUrl}>
                <div className="group relative overflow-hidden rounded-lg bg-card hover:bg-card/80 transition-colors">
                  <div className="aspect-video relative">
                    <Image
                      src={item.posterUrl || "/placeholder-movie.jpg"}
                      alt={item.movieName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-primary/20 backdrop-blur-sm rounded-full p-3">
                        <Play className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <Progress value={progressPercent} className="h-1" />
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant="secondary"
                        className="bg-black/60 text-white"
                      >
                        {progressPercent}%
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">
                      {item.movieName}
                    </h3>
                    {item.episodeName && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {item.episodeName}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {Math.floor(item.progress / 60)}:
                        {Math.floor(item.progress % 60)
                          .toString()
                          .padStart(2, "0")}{" "}
                        / {Math.floor(item.duration / 60)}:
                        {Math.floor(item.duration % 60)
                          .toString()
                          .padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
