"use client";

import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  removeFromWatchHistory,
  removeMovieFromWatchHistory,
} from "@/actions/watch-history";

interface WatchHistoryCardProps {
  id: string;
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl: string | null;
  thumbUrl: string | null;
  movieType: string | null;
  episodeId?: string | null;
  episodeName: string | null;
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
  thumbUrl,
  movieType,
  episodeId,
  episodeName,
  progress,
  duration,
  watchedAt,
  onRemove,
}: WatchHistoryCardProps) {
  const [isPending, startTransition] = useTransition();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN");
  };

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return "/placeholder-movie.jpg";
    if (imagePath.startsWith("http")) return imagePath;
    return `https://phimimg.com/${imagePath}`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const progressPercentage = duration ? (progress / duration) * 100 : 0;

  const handleRemove = async () => {
    startTransition(async () => {
      try {
        let result = await removeFromWatchHistory(
          movieId,
          episodeId || undefined
        );
        if (!result.success) {
          result = await removeMovieFromWatchHistory(movieId);
        }

        if (result.success) {
          toast.success("Đã xóa khỏi lịch sử xem");
          onRemove?.(movieId);
        } else {
          toast.error(result.error || "Không thể xóa");
        }
      } catch (error) {
        toast.error("Có lỗi xảy ra");
        console.error(error);
      }
    });
  };

  return (
    <Card className="group relative flex flex-col md:flex-row gap-4 overflow-hidden border p-3 md:p-4 transition-all hover:shadow-lg hover:-translate-y-1">
      {/* Poster */}
      <div className="relative w-full md:w-28 aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0">
        <Image
          src={getImageUrl(posterUrl || thumbUrl)}
          alt={movieName}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Play overlay */}
        <Link
          href={`/phim/${movieSlug}${episodeId ? `?tap=${episodeId}` : ""}`}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="bg-black/60 backdrop-blur-sm rounded-full p-2">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
        </Link>

        {/* Episode badge */}
        {episodeName && (
          <Badge className="absolute top-2 right-2 bg-black/70 text-white border-0 text-xs">
            {episodeName}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between space-y-3 min-w-0">
        <div className="space-y-2">
          {/* Title */}
          <Link
            href={`/phim/${movieSlug}${episodeId ? `?tap=${episodeId}` : ""}`}
          >
            <h3 className="font-semibold text-base md:text-lg line-clamp-2 hover:text-primary transition-colors">
              {movieName}
            </h3>
          </Link>

          {/* Type */}
          {movieType && (
            <Badge variant="outline" className="text-xs">
              {movieType === "series" ? "Phim bộ" : "Phim lẻ"}
            </Badge>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{Math.round(progressPercentage)}%</span>
            {duration && <span>{formatDuration(duration)}</span>}
          </div>
          <Progress value={progressPercentage} className="h-1.5" />
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(new Date(watchedAt))}</span>
            {duration && (
              <>
                <span className="mx-1">•</span>
                <Clock className="w-3 h-3" />
                <span>{formatDuration(duration)}</span>
              </>
            )}
          </div>

          <Link
            href={`/phim/${movieSlug}${episodeId ? `?tap=${episodeId}` : ""}`}
          >
            <Button
              size="sm"
              variant={progressPercentage >= 95 ? "outline" : "default"}
              className="h-7 px-3 text-xs w-full"
            >
              <Play className="w-3 h-3 mr-1" />
              {progressPercentage >= 95 ? "Xem lại" : "Tiếp tục"}
            </Button>
          </Link>
        </div>
      </div>

      {/* Remove button */}
      <Button
        size="sm"
        variant="destructive"
        className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={handleRemove}
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </Card>
  );
}
