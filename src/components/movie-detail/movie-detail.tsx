"use client";

import { useState, useEffect } from "react";
import { MovieHero } from "./movie-hero";
import { VideoPlayer } from "./video-player";
import { MovieInfo } from "./movie-info";
import { CastCrew } from "./cast-drew";
import { EpisodeList } from "./episode-list";
import { MovieStats } from "./movie-stats";
import { Episode, MovieDetailResponse } from "@/types/movie-detail.types";
import {
  MovieHeroSkeleton,
  VideoPlayerSkeleton,
  MovieInfoSkeleton,
  CastCrewSkeleton,
  EpisodeListSkeleton,
  MovieStatsSkeleton,
} from "./skeletons";

interface MovieDetailProps {
  slug: string;
  initialData?: MovieDetailResponse | null;
}

export default function MovieDetail({ slug, initialData }: MovieDetailProps) {
  const [movieData, setMovieData] = useState<MovieDetailResponse | null>(
    initialData || null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [selectedServer, setSelectedServer] = useState(0);

  useEffect(() => {
    if (initialData && initialData.status === true && initialData.movie) {
      setMovieData(initialData);
      setLoading(false);
      setError(null);

      if (
        initialData.episodes &&
        initialData.episodes.length > 0 &&
        initialData.episodes[0].server_data &&
        initialData.episodes[0].server_data.length > 0
      ) {
        setSelectedEpisode(initialData.episodes[0].server_data[0]);
      }
      return;
    }

    const fetchMovieData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/phim/${slug}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch movie: ${response.status}`);
        }

        const data: MovieDetailResponse = await response.json();

        if (data.status === true && data.movie) {
          setMovieData(data);
          if (
            data.episodes &&
            data.episodes.length > 0 &&
            data.episodes[0].server_data &&
            data.episodes[0].server_data.length > 0
          ) {
            setSelectedEpisode(data.episodes[0].server_data[0]);
          }
        } else {
          throw new Error(data.msg || "Failed to load movie data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching movie:", err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchMovieData();
    }
  }, [slug, initialData]);

  const handleEpisodeSelect = (episode: Episode, serverIndex: number) => {
    setSelectedEpisode(episode);
    setSelectedServer(serverIndex);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MovieHeroSkeleton />

        <div className="max-w-7xl mx-auto ">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            <div className="grid gap-8">
              <VideoPlayerSkeleton />
              <MovieInfoSkeleton />
              <CastCrewSkeleton />
            </div>

            <div className="grid gap-8">
              <EpisodeListSkeleton />
              <MovieStatsSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !movieData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Lỗi</h1>
          <p className="text-muted-foreground">
            {error || "Không thể tải thông tin phim"}
          </p>
        </div>
      </div>
    );
  }

  const { movie, episodes } = movieData;

  return (
    <div className="min-h-screen bg-background">
      <MovieHero movie={movie} />

      <div className="max-w-7xl mx-auto ">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          <div className="grid gap-8">
            {selectedEpisode && (
              <VideoPlayer
                selectedEpisode={selectedEpisode}
                selectedServer={episodes[selectedServer]}
              />
            )}

            <MovieInfo movie={movie} />

            <CastCrew movie={movie} />
          </div>

          <div className="grid gap-8">
            {selectedEpisode && (
              <EpisodeList
                movie={movie}
                episodes={episodes}
                selectedEpisode={selectedEpisode}
                selectedServer={selectedServer}
                onEpisodeSelect={handleEpisodeSelect}
              />
            )}

            <MovieStats movie={movie} />
          </div>
        </div>
      </div>
    </div>
  );
}
