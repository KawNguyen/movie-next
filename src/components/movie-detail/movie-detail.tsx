"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MovieHero } from "./movie-hero";
import { MovieInfo } from "./movie-info";
import { CastCrew } from "./cast-drew";
import { MovieStats } from "./movie-stats";
import { MovieDetailLoading } from "./movie-detail-loading";
import { WatchSection } from "./watch-section";
import { MAIN_GRID } from "./movie-detail-layout";
import { MovieDetailResponse } from "@/types/movie-detail.types";

interface MovieDetailProps {
  slug: string;
  initialData?: MovieDetailResponse | null;
}

const isValid = (d?: MovieDetailResponse | null): d is MovieDetailResponse =>
  !!d && d.status === true && !!d.movie;

export default function MovieDetail({ slug, initialData }: MovieDetailProps) {
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
        if (!isValid(data)) throw new Error("Failed to load movie data");
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

  if (loading) {
    return <MovieDetailLoading />;
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

        <div className="space-y-4">
          <WatchSection movie={movie} episodes={movieData.episodes} />

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
