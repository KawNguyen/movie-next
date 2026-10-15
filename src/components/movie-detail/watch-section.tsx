"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VideoPlayer } from "./video-player";
import { EpisodeList } from "./episode-list";
import { ResumePrompt, type ResumeServer } from "./resume-prompt";
import { WatchSectionSkeleton } from "./skeletons";
import { MovieDetailResponse } from "@/types/movie-detail.types";
import {
  getEpisodeUrlParam,
  resolveServerIndex,
  resolveTap,
} from "@/lib/episode-params";
import { getServerSlug } from "@/lib/movie-url";
import { useWatchHistoryStore } from "@/stores/watch-history-store";
import { MAIN_GRID } from "./movie-detail-layout";

type Movie = MovieDetailResponse["movie"];
type Episodes = MovieDetailResponse["episodes"];

/**
 * Tổng số tập: ưu tiên `movie.episode_total` ("80", "80 Tập", "24/80" -> 80),
 * không đọc được (vd "Đang cập nhật", "?") thì dùng số tập hiện có của server đang xem.
 */
function resolveTotalEpisodes(
  episodeTotal: unknown,
  availableCount: number,
): number | null {
  const nums = String(episodeTotal ?? "")
    .match(/\d+/g)
    ?.map(Number)
    .filter((n) => n > 0);
  if (nums?.length) return Math.max(...nums);
  return availableCount > 0 ? availableCount : null;
}

function WatchSectionContent({
  movie,
  episodes,
}: {
  movie: Movie;
  episodes: Episodes;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const serverParam = searchParams.get("server");
  const tapParam = searchParams.get("tap");

  // Chỉ gợi ý "xem tiếp" khi user vào trang phim "trần" (chưa có ?tap=).
  // Nếu vào từ trang lịch sử (đã kèm tap) thì đang phát đúng tập rồi, không cần hỏi.
  const [showResumePrompt] = useState(() => !tapParam);

  const { serverIndex, tap, episode } = useMemo(() => {
    const list = episodes ?? [];
    const serverIndex = resolveServerIndex(list, serverParam);
    const server = list[serverIndex];
    const tap = resolveTap(server, tapParam);
    return {
      serverIndex,
      tap,
      episode: server?.server_data?.[tap - 1] ?? null,
    };
  }, [episodes, serverParam, tapParam]);

  const handleSelect = useCallback(
    (nextServer: number, nextTap: number) => {
      if (!episodes?.[nextServer]) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("server", getServerSlug(episodes[nextServer].server_name));
      params.set(
        "tap",
        getEpisodeUrlParam(
          episodes[nextServer].server_data[nextTap - 1]?.slug ?? String(nextTap),
        ),
      );
      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    },
    [episodes, router, searchParams],
  );

  // Dữ liệu cho ResumePrompt: gom tập theo server
  const resumeServers = useMemo<ResumeServer[]>(
    () =>
      (episodes ?? []).map((s) => ({
        serverSlug: getServerSlug(s.server_name),
        episodes: (s.server_data ?? []).map((e) => ({
          slug: e.slug,
          name: e.name,
        })),
      })),
    [episodes],
  );

  const handleResume = useCallback(
    (episodeSlug: string, serverSlug: string) => {
      const sIdx = (episodes ?? []).findIndex(
        (s) => getServerSlug(s.server_name) === serverSlug,
      );
      if (sIdx < 0) return;
      const eIdx = episodes[sIdx].server_data.findIndex(
        (e) => e.slug === episodeSlug,
      );
      if (eIdx < 0) return;
      handleSelect(sIdx, eIdx + 1);
    },
    [episodes, handleSelect],
  );

  const server = episodes[serverIndex];

  const totalEpisodes = useMemo(
    () =>
      resolveTotalEpisodes(
        movie.episode_total,
        server?.server_data?.length ?? 0,
      ),
    [movie.episode_total, server],
  );

  // Điền tổng số tập cho lịch sử đã có (dữ liệu cũ đang null), không cần chờ xem video
  const hydrated = useWatchHistoryStore((s) => s.hydrated);
  const setTotalEpisodes = useWatchHistoryStore((s) => s.setTotalEpisodes);
  useEffect(() => {
    if (hydrated && totalEpisodes) setTotalEpisodes(movie._id, totalEpisodes);
  }, [hydrated, totalEpisodes, movie._id, setTotalEpisodes]);

  return (
    <div className="space-y-4">
      {showResumePrompt && (
        <ResumePrompt
          movieId={movie._id}
          servers={resumeServers}
          currentEpisodeId={episode?.slug}
          currentServerSlug={server ? getServerSlug(server.server_name) : undefined}
          onResume={handleResume}
        />
      )}

      <div className={MAIN_GRID}>
        {episode && server && (
          <VideoPlayer
            episode={episode}
            serverName={server.server_name}
            movieId={movie._id}
            movieSlug={movie.slug}
            movieName={movie.name}
            posterUrl={movie.poster_url}
            thumbUrl={movie.thumb_url}
            totalEpisodes={totalEpisodes}
          />
        )}
        <div className="relative min-w-0">
          <div className="lg:absolute lg:inset-0">
            <EpisodeList
              movie={movie}
              episodes={episodes}
              activeServer={serverIndex}
              activeTap={tap}
              pending={isPending}
              onSelect={handleSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function WatchSection({
  movie,
  episodes,
}: {
  movie: Movie;
  episodes: Episodes;
}) {
  return (
    <Suspense fallback={<WatchSectionSkeleton />}>
      <WatchSectionContent movie={movie} episodes={episodes} />
    </Suspense>
  );
}