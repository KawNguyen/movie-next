"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  selectContinueWatching,
  useWatchHistoryStore,
  type ContinueWatchingItem,
} from "@/stores/watch-history-store";
import { getEpisodeUrlParam } from "@/lib/episode-params";

function getWatchUrl({ movie, episode, needsNextEpisode }: ContinueWatchingItem) {
  // Tập đã xem xong -> không kèm `tap`, để trang phim tự chọn tập kế tiếp
  if (needsNextEpisode) {
    return `/phim/${movie.movieSlug}?${new URLSearchParams({
      server: episode.serverSlug,
    })}`;
  }
  return `/phim/${movie.movieSlug}?${new URLSearchParams({
    tap: getEpisodeUrlParam(episode.episodeId),
    server: episode.serverSlug,
  })}`;
}

function formatRemaining(progress: number, duration: number) {
  const minutes = Math.max(1, Math.round((duration - progress) / 60));
  if (minutes < 60) return `Còn ${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `Còn ${h}g ${m}p` : `Còn ${h} giờ`;
}

export function WatchHistoryList() {
  const movies = useWatchHistoryStore((state) => state.movies);
  const hydrated = useWatchHistoryStore((state) => state.hydrated);
  const removeMovie = useWatchHistoryStore((state) => state.removeMovie);
  const clearHistory = useWatchHistoryStore((state) => state.clearHistory);

  const items = useMemo(() => selectContinueWatching(movies), [movies]);

  if (!hydrated) {
    return (
      <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-video animate-pulse rounded-xl bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <Play className="size-7 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Chưa có lịch sử xem</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Những phim bạn đang xem dở sẽ xuất hiện ở đây để tiếp tục nhanh hơn.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tiếp tục xem</h1>
          <p className="text-sm text-muted-foreground">{items.length} phim</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={clearHistory}
        >
          Xóa tất cả
        </Button>
      </div>

      <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
          const { movie, episode, needsNextEpisode } = item;
          const href = getWatchUrl(item);
          const percent = needsNextEpisode
            ? 100
            : Math.min(
                100,
                Math.round((episode.progress / episode.duration) * 100),
              );

          return (
            <article key={movie.movieId} className="group relative">
              <Link href={href} className="block space-y-3">
                <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={movie.thumbUrl || movie.posterUrl || "/placeholder.svg"}
                    alt={movie.movieName}
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />

                  {/* gradient + play khi hover */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                    <span className="flex size-12 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
                      <Play className="size-5 translate-x-0.5 fill-current" />
                    </span>
                  </div>

                  {/* tập đang xem */}
                  <span className="absolute left-2.5 top-2.5 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                    {episode.episodeName}
                  </span>

                  {/* thời gian còn lại */}
                  <span className="absolute bottom-3 right-2.5 text-xs font-medium text-white/90">
                    {needsNextEpisode
                      ? "Đã xem xong"
                      : formatRemaining(episode.progress, episode.duration)}
                  </span>

                  <Progress
                    value={percent}
                    aria-label={`Đã xem ${percent}%`}
                    className="absolute inset-x-0 bottom-0 h-1 rounded-none bg-white/25"
                  />
                </div>

                <div className="min-w-0 px-0.5">
                  <h2 className="line-clamp-1 font-medium transition-colors group-hover:text-primary">
                    {movie.movieName}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {needsNextEpisode ? "Xem tập tiếp theo" : "Xem tiếp"}
                  </p>
                </div>
              </Link>

              {/* nút xóa: luôn hiện trên mobile, hiện khi hover trên desktop */}
              <button
                type="button"
                aria-label={`Xóa ${movie.movieName} khỏi lịch sử`}
                onClick={() => removeMovie(movie.movieId)}
                className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-destructive focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
              >
                <X className="size-4" />
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}