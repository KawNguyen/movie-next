"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Play, Trash2 } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  removeFromWatchHistory,
  removeMovieFromWatchHistory,
} from "@/actions/watch-history";
import { toast } from "sonner";
import { useTransition } from "react";

interface WatchHistoryCardProps {
  id: string;
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl: string | null;
  movieType: string | null;
  episodeId?: string | null;
  episode: number | null;
  progress: number;
  duration: number | null;
  watchedAt: Date;
  onRemove?: (movieId: string) => void;
}

export function WatchHistoryCard({
  movieId,
  movieSlug,
  movieName,
  posterUrl,
  movieType,
  episodeId,
  episode,
  progress,
  duration,
  watchedAt,
  onRemove,
}: WatchHistoryCardProps) {
  const [isPending, startTransition] = useTransition();

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return "/placeholder-movie.jpg";
    if (imagePath.startsWith("http")) return imagePath;
    return `https://phimimg.com/${imagePath}`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatProgress = (current: number, total: number | null) => {
    if (!total) return `${Math.floor(current / 60)}m`;
    const percentage = (current / total) * 100;
    return `${percentage.toFixed(0)}%`;
  };

  const handleRemove = async () => {
    startTransition(async () => {
      try {
        // Debug logging
        console.log("Removing watch history:", {
          movieId,
          episodeId,
          episodeIdType: typeof episodeId,
          normalizedEpisodeId: episodeId || undefined,
        });

        // Thử xóa exact record trước
        let result = await removeFromWatchHistory(
          movieId,
          episodeId || undefined
        );

        // Nếu không thành công, thử xóa tất cả records của movie
        if (!result.success) {
          console.log(
            "Exact deletion failed, trying to remove all movie records..."
          );
          result = await removeMovieFromWatchHistory(movieId);
        }

        if (result.success) {
          toast.success("Đã xóa khỏi lịch sử xem");
          onRemove?.(movieId);
        } else {
          toast.error(result.error || "Không thể xóa khỏi lịch sử xem");
        }
      } catch (error) {
        toast.error("Có lỗi xảy ra");
        console.error("Error removing watch history:", error);
      }
    });
  };

  const progressPercentage = duration ? (progress / duration) * 100 : 0;

  return (
    <Card className="group border-1 p-0 overflow-hidden transition-all duration-300 hover:-translate-y-2 relative">
      <Link href={`/phim/${movieSlug}${episode ? `?tap=${episode}` : ""}`}>
        <CardHeader className="p-0">
          <AspectRatio
            ratio={2 / 3}
            className="relative overflow-hidden w-full"
          >
            <Image
              src={getImageUrl(posterUrl)}
              alt={movieName}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Progress overlay */}
            {progressPercentage > 5 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            )}

            {/* Continue watching badge */}
            <Badge className="absolute top-3 left-3 bg-blue-500/80 text-white border-0">
              <Play className="w-3 h-3 mr-1 fill-white" />
              Tiếp tục xem
            </Badge>

            {/* Episode badge */}
            {episode && (
              <Badge className="absolute top-3 right-3 bg-black/70 text-white border-0">
                Tập {episode}
              </Badge>
            )}
          </AspectRatio>
        </CardHeader>
      </Link>

      <CardContent className="p-2 sm:p-3 text-center sm:text-left">
        <h3 className="font-semibold text-md md:text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {movieName}
        </h3>

        <div className="space-y-2 mb-3">
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatProgress(progress, duration)}</span>
              {duration && <span>{formatDuration(duration)}</span>}
            </div>
            <Progress value={progressPercentage} className="h-1" />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(watchedAt).toLocaleDateString("vi-VN")}
          </div>
          {movieType && (
            <Badge variant="outline" className="text-xs">
              {movieType === "series" ? "Phim bộ" : "Phim lẻ"}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <Clock className="w-3 h-3" />
          {new Date(watchedAt).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </CardContent>

      <Button
        size="sm"
        variant="destructive"
        className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleRemove}
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </Card>
  );
}
