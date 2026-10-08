"use client";

import { Suspense, useCallback, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VideoPlayer } from "./video-player";
import { EpisodeList } from "./episode-list";
import { WatchSectionSkeleton } from "./skeletons";
import { MovieDetailResponse } from "@/types/movie-detail.types";
import { resolveServerIndex, resolveTap } from "@/lib/episode-params";
import { getServerSlug } from "@/lib/movie-url";
import { MAIN_GRID } from "./movie-detail-layout";

type Movie = MovieDetailResponse["movie"];
type Episodes = MovieDetailResponse["episodes"];

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
      params.set("tap", String(nextTap));
      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    },
    [episodes, router, searchParams],
  );

  const server = episodes[serverIndex];

  return (
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
