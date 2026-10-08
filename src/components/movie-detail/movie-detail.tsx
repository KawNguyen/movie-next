"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { MovieHero } from "./movie-hero";
import { VideoPlayer } from "./video-player";
import { MovieInfo } from "./movie-info";
import { CastCrew } from "./cast-drew";
import { EpisodeList } from "./episode-list";
import { MovieStats } from "./movie-stats";
import {
  MovieHeroSkeleton,
  VideoPlayerSkeleton,
  MovieInfoSkeleton,
  CastCrewSkeleton,
  EpisodeListSkeleton,
  MovieStatsSkeleton,
} from "./skeletons";
import { MovieDetailResponse } from "@/types/movie-detail.types";
import {
  getServerSlug,
  resolveServerIndex,
  resolveTap,
} from "@/lib/episode-params";

interface MovieDetailProps {
  slug: string;
  initialData?: MovieDetailResponse | null;
}

const isValid = (d?: MovieDetailResponse | null): d is MovieDetailResponse =>
  !!d && d.status === true && !!d.movie;

const MAIN_GRID = "grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]";

export default function MovieDetail({ slug, initialData }: MovieDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [movieData, setMovieData] = useState<MovieDetailResponse | null>(
    isValid(initialData) ? initialData : null,
  );
  // Có dữ liệu SSR thì không cần hiện skeleton
  const [loading, setLoading] = useState(!isValid(initialData));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isValid(initialData)) {
      setMovieData(initialData);
      setLoading(false);
      setError(null);
      return;
    }
    if (!slug) return;

    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/phim/${slug}`, { signal: ac.signal });
        if (!res.ok) throw new Error(`Failed to fetch movie: ${res.status}`);
        const data: MovieDetailResponse = await res.json();
        if (!isValid(data))
          throw new Error(data || "Failed to load movie data");
        setMovieData(data);
      } catch (err) {
        if (ac.signal.aborted) return;
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [slug, initialData]);

  // Tập/server đang xem được SUY RA từ URL, không lưu trong state
  // -> bỏ 2 useState + 1 useEffect, không còn render thừa / lệch state.
  const episodes = movieData?.episodes;
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
      const list = movieData?.episodes;
      if (!list?.[nextServer]) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("server", getServerSlug(list[nextServer].server_name));
      params.set("tap", String(nextTap));
      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    },
    [movieData, router, searchParams],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MovieHeroSkeleton />
        <div className="mx-auto max-w-7xl space-y-4 px-4">
          <div className={MAIN_GRID}>
            <VideoPlayerSkeleton />
            <EpisodeListSkeleton />
          </div>
          <div className={MAIN_GRID}>
            <div className="grid gap-4">
              <MovieInfoSkeleton />
              <CastCrewSkeleton />
            </div>
            <MovieStatsSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error || !movieData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center" role="alert">
          <h1 className="mb-2 text-2xl font-bold text-destructive">Lỗi</h1>
          <p className="mb-4 text-muted-foreground">
            {error || "Không thể tải thông tin phim"}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  const { movie } = movieData;
  const server = movieData.episodes[serverIndex];

  return (
    <div className="relative px-4">
      <div className="absolute inset-x-0 top-0 -z-0 h-[60vh]">
        <Image
          src={movie.thumb_url || "/placeholder.svg"}
          alt=""
          fill
          sizes="100vw"
          quality={50}
          priority
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="relative space-y-8 pt-8">
        <MovieHero movie={movie} />

        <div className="space-y-4 ">
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
            {/* Cột tập phim luôn cao bằng player; danh sách tự cuộn bên trong */}
            <div className="relative min-w-0">
              <div className="lg:absolute lg:inset-0">
                <EpisodeList
                  movie={movie}
                  episodes={movieData.episodes}
                  activeServer={serverIndex}
                  activeTap={tap}
                  pending={isPending}
                  onSelect={handleSelect}
                />
              </div>
            </div>
          </div>

          <div className={MAIN_GRID}>
            <div className="grid content-start gap-4">
              <MovieInfo movie={movie} />
              <CastCrew movie={movie} />
            </div>
            <MovieStats movie={movie} />
          </div>
        </div>
      </div>
    </div>
  );
}
