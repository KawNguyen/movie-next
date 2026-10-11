"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWatchHistoryStore } from "@/stores/watch-history-store";
import { getEpisodeUrlParam } from "@/lib/episode-params";

export function WatchHistoryList() {
  const history = useWatchHistoryStore((state) => state.history);
  const hydrated = useWatchHistoryStore((state) => state.hydrated);
  const removeProgress = useWatchHistoryStore((state) => state.removeProgress);
  const clearHistory = useWatchHistoryStore((state) => state.clearHistory);
  const getWatchUrl = (movieSlug: string, episodeSlug: string, serverSlug: string) => {
    const params = new URLSearchParams({
      tap: getEpisodeUrlParam(episodeSlug),
      server: serverSlug,
    });
    return `/phim/${movieSlug}?${params.toString()}`;
  };

  if (!hydrated) {
    return <div className="py-12 text-center text-muted-foreground">Đang tải lịch sử xem…</div>;
  }

  if (history.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-5xl">📺</div>
        <h2 className="text-lg font-medium">Chưa có lịch sử xem</h2>
        <p className="mt-2 text-muted-foreground">Tiến độ xem phim của bạn sẽ xuất hiện ở đây.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={clearHistory}>
          Xóa toàn bộ
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {history.map((item) => {
          const percent = Math.min(
            100,
            Math.round((item.progress / item.duration) * 100),
          );

          return (
            <article key={item.id} className="overflow-hidden rounded-xl border bg-card">
              <Link href={getWatchUrl(item.movieSlug, item.episodeId, item.serverSlug)}>
                <div className="relative aspect-video bg-muted">
                  <Image
                    src={item.posterUrl || item.thumbUrl || "/placeholder.svg"}
                    alt={item.movieName}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
                    <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              </Link>
              <div className="space-y-2 p-3">
                <Link href={getWatchUrl(item.movieSlug, item.episodeId, item.serverSlug)}>
                  <h2 className="line-clamp-2 font-semibold hover:text-primary">
                    {item.movieName}
                  </h2>
                </Link>
                <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                  <span>{item.episodeName}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {percent}%
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => removeProgress(item.movieId, item.episodeId)}
                >
                  <Trash2 className="size-4" /> Xóa
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
