"use client";

import { useEffect, useState } from "react";
import { getAllWatchHistoryList } from "@/actions/watch-events";
import { WatchHistoryCard } from "./watch-history-card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { WatchHistory } from "@prisma/client";
import type { WatchHistoryMovie } from "@/data";

interface WatchHistoryListProps {
  initialData?: WatchHistoryMovie[];
  error?: string;
}

export function WatchHistoryList({
  initialData,
  error: initialError,
}: WatchHistoryListProps) {
  const [watchHistory, setWatchHistory] = useState<WatchHistory[]>(
    initialData?.map((item) => ({
      id: item.id,
      userId: "",
      movieId: item.movieId,
      movieSlug: item.movieSlug,
      movieName: item.movieName,
      posterUrl: item.posterUrl,
      thumbUrl: item.thumbUrl,
      episodeId: item.episodeId,
      episodeName: item.episodeName,
      watchedAt: item.watchedAt,
      progress: item.progress,
      duration: item.duration,
    })) || []
  );
  const [isLoading, setIsLoading] = useState(!initialData);

  const loadWatchHistory = async () => {
    try {
      setIsLoading(true);
      const result = await getAllWatchHistoryList();
      if (result.success) {
        setWatchHistory(result.data || []);
      } else {
        toast.error(result.error || "Không thể tải lịch sử xem phim");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi tải lịch sử xem phim");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialError) {
      toast.error(initialError);
    }

    if (!initialData) {
      loadWatchHistory();
    }
  }, [initialData, initialError]);

  const handleRemoveHistory = (movieId: string) => {
    setWatchHistory((prev) => prev.filter((item) => item.movieId !== movieId));
  };

  if (isLoading) {
    return (
      <>
        {/* Mobile Loading Skeletons */}
        <div className="block md:hidden">
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[2/3] bg-muted rounded-lg mb-2" />
                <div className="h-4 bg-muted rounded mb-1" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Loading Skeletons */}
        <div className="hidden md:block">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-24 h-36 bg-muted rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-2 bg-muted rounded w-full" />
                    <div className="flex justify-between">
                      <div className="h-3 bg-muted rounded w-1/4" />
                      <div className="h-7 bg-muted rounded w-20" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (watchHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📺</div>
        <h3 className="text-lg font-medium mb-2">Chưa có lịch sử xem phim</h3>
        <p className="text-muted-foreground mb-4">
          Hãy bắt đầu xem phim để theo dõi tiến trình của bạn
        </p>
        <Button onClick={() => window.history.back()}>Khám phá phim mới</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Lịch sử xem phim ({watchHistory.length})
        </h1>
        <Button variant="outline" size="sm" onClick={loadWatchHistory}>
          Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
        {watchHistory.map((item) => (
          <WatchHistoryCard
            key={item.id}
            id={item.id}
            movieId={item.movieId}
            movieSlug={item.movieSlug}
            movieName={item.movieName}
            posterUrl={item.posterUrl}
            thumbUrl={item.thumbUrl}
            movieType={null}
            episodeId={item.episodeId}
            episodeName={item.episodeName}
            progress={item.progress}
            duration={item.duration}
            watchedAt={item.watchedAt}
            onRemove={handleRemoveHistory}
          />
        ))}
      </div>
    </div>
  );
}
