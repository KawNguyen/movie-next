"use client";

import { useEffect, useState } from "react";
import { getWatchHistory } from "@/actions/watch-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatWatchTime, formatWatchProgress, shouldShowInContinueWatching } from "@/lib/watch-history-utils";

interface WatchHistoryItem {
  id: string;
  userId: string;
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl: string | null;
  episodeId: string | null;
  episodeName: string | null;
  watchedAt: Date;
  progress: number;
  duration: number;
}

export function ContinueWatching() {
  const [recentWatches, setRecentWatches] = useState<WatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRecentWatches = async () => {
      try {
        const result = await getWatchHistory();
        if (result.success && result.data) {
          const filtered = result.data
            .filter((item) => shouldShowInContinueWatching(item.progress, item.duration))
            .slice(0, 4);
          setRecentWatches(filtered);
        }
      } catch (error) {
        console.error("Error loading recent watches:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentWatches();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Tiếp tục xem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[2/3] bg-muted rounded-lg mb-2" />
                <div className="h-4 bg-muted rounded mb-1" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentWatches.length === 0) {
    return null;
  }

  const formatProgress = (progress: number, duration: number) => {
    return formatWatchProgress(progress, duration);
  };

  const formatTime = (seconds: number) => {
    return formatWatchTime(seconds);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Tiếp tục xem
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recentWatches.map((item) => {
            const progressPercent = item.duration > 0 ? (item.progress / item.duration) * 100 : 0;
            const episodeUrl = item.episodeId 
              ? `/phim/${item.movieSlug}?tap=${item.episodeName || item.episodeId}`
              : `/phim/${item.movieSlug}`;
            
            return (
              <Link key={item.id} href={episodeUrl} className="group">
                <div className="space-y-2">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                    {item.posterUrl ? (
                      <Image
                        src={item.posterUrl}
                        alt={item.movieName}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Play className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                      <div className="w-full bg-gray-600 rounded-full h-1">
                        <div 
                          className="bg-primary h-1 rounded-full transition-all" 
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-primary/90 rounded-full p-2">
                        <Play className="w-6 h-6 text-primary-foreground" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {item.movieName}
                    </h3>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatProgress(item.progress, item.duration)}</span>
                      <span>{formatTime(item.progress)}</span>
                    </div>
                    
                    {item.episodeName && (
                      <Badge variant="secondary" className="text-xs">
                        {item.episodeName}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        
        <div className="mt-4 text-center">
          <Link href="/lich-su-xem">
            <Button variant="outline" size="sm">
              Xem tất cả lịch sử
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
