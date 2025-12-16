"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
import Image from "next/image";

interface MovieDetailProps {
  slug: string;
  initialData?: MovieDetailResponse | null;
}

export default function MovieDetail({ slug, initialData }: MovieDetailProps) {
  const searchParams = useSearchParams();
  const [movieData, setMovieData] = useState<MovieDetailResponse | null>(
    initialData || null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [selectedServer, setSelectedServer] = useState(0);

  useEffect(() => {
    if (!movieData?.episodes || movieData.episodes.length === 0) return;

    const tapParam = searchParams.get("tap");
    const serverParam = searchParams.get("server");

    // Helper function để tìm server index từ server param
    const getServerIndexFromParam = (serverParam: string) => {
      return movieData.episodes.findIndex((server) => {
        const serverName = server.server_name.toLowerCase();
        if (serverParam === "vietsub" && serverName.includes("vietsub")) {
          return true;
        }
        if (
          serverParam === "thuyet-minh" &&
          (serverName.includes("lồng tiếng") ||
            serverName.includes("thuyết minh"))
        ) {
          return true;
        }
        return false;
      });
    };

    // Xác định server index
    let targetServerIndex = 0;
    if (serverParam) {
      const foundServerIndex = getServerIndexFromParam(serverParam);
      if (foundServerIndex >= 0) {
        targetServerIndex = foundServerIndex;
      }
    }

    if (tapParam) {
      const tapNumber = parseInt(tapParam);
      if (!isNaN(tapNumber) && tapNumber > 0) {
        const server = movieData.episodes[targetServerIndex];
        if (server?.server_data && server.server_data.length >= tapNumber) {
          const episode = server.server_data[tapNumber - 1];
          if (episode) {
            setSelectedEpisode(episode);
            setSelectedServer(targetServerIndex);
            return;
          }
        }
      }
    }

    // Fallback: chọn tập đầu tiên của server được chỉ định hoặc server đầu tiên
    const defaultServer =
      movieData.episodes[targetServerIndex] || movieData.episodes[0];
    if (defaultServer?.server_data?.[0]) {
      setSelectedEpisode(defaultServer.server_data[0]);
      setSelectedServer(targetServerIndex);
    }
  }, [movieData, searchParams]);

  useEffect(() => {
    if (initialData && initialData.status === true && initialData.movie) {
      setMovieData(initialData);
      setLoading(false);
      setError(null);
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
    // The episode selection will be handled by the useEffect that watches searchParams
    // This function is kept for compatibility with EpisodeList component
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
    <div className="relative">
      <div className="absolute inset-0 h-[60vh]">
        <Image
          src={movie.thumb_url || "/placeholder.svg"}
          alt={movie.name}
          fill
          className="object-cover rounded-lg w-full h-[60vh] max-h-[66vh]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
      </div>
      <div className="relative space-y-8 pt-8">
        <MovieHero movie={movie} />

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 h-full w-full">
              <div className="lg:col-span-4 col-span-1">
                {selectedEpisode && (
                  <VideoPlayer
                    key={`${selectedEpisode.slug}-${selectedServer}`}
                    selectedEpisode={selectedEpisode}
                    selectedServer={episodes[selectedServer]}
                    movieId={movie._id}
                    movieSlug={movie.slug}
                    movieName={movie.name}
                    posterUrl={movie.poster_url}
                    thumbUrl={movie.thumb_url}
                  />
                )}
              </div>
              <div className="lg:col-span-2 col-span-1">
                {selectedEpisode && (
                  <EpisodeList
                    movie={movie}
                    episodes={episodes}
                    selectedEpisode={selectedEpisode}
                    selectedServer={selectedServer}
                    onEpisodeSelect={handleEpisodeSelect}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 h-full w-full">
              <div className="grid col-span-1 lg:col-span-4 gap-4">
                <MovieInfo movie={movie} />

                <CastCrew movie={movie} />
              </div>
              <div className="col-span-1 lg:col-span-2">
                <MovieStats movie={movie} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
