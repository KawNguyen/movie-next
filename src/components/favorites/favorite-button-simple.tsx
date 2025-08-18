"use client";

import { useEffect, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addToFavorites, removeFromFavorites } from "@/actions/favorites";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FavoriteButtonSimpleProps {
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl?: string;
  movieType?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function FavoriteButtonSimple({
  movieId,
  movieSlug,
  movieName,
  posterUrl,
  movieType,
  className,
  size = "sm",
}: FavoriteButtonSimpleProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Check favorite status when component mounts - only for single movie
  useEffect(() => {
    const checkStatus = async () => {
      try {
        if (!movieId || typeof movieId !== "string" || !movieId.trim()) {
          console.warn("Invalid movieId provided to FavoriteButton:", movieId);
          setIsLoading(false);
          return;
        }

        // Use the single-item API check for detail pages
        const response = await fetch(
          `/api/favorites/check/${encodeURIComponent(movieId)}`
        );
        const result = await response.json();

        if (result.success) {
          setIsFavorite(result.data);
        }
      } catch (error) {
        console.error("Error checking favorite status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [movieId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!movieId || typeof movieId !== "string" || !movieId.trim()) {
      toast.error("MovieId không hợp lệ");
      return;
    }

    startTransition(async () => {
      try {
        if (isFavorite) {
          const result = await removeFromFavorites(movieId);
          if (result.success) {
            setIsFavorite(false);
            toast.success("Đã xóa khỏi danh sách yêu thích");
          } else {
            toast.error(
              result.error || "Không thể xóa khỏi danh sách yêu thích"
            );
          }
        } else {
          const result = await addToFavorites({
            movieId,
            movieSlug,
            movieName,
            posterUrl,
            movieType,
          });
          if (result.success) {
            setIsFavorite(true);
            toast.success("Đã thêm vào danh sách yêu thích");
          } else {
            toast.error(
              result.error || "Không thể thêm vào danh sách yêu thích"
            );
          }
        }
      } catch (error) {
        toast.error("Có lỗi xảy ra");
        console.error("Error toggling favorite:", error);
      }
    });
  };

  const sizeClasses = {
    sm: "h-8 w-8 p-0",
    md: "h-10 w-10 p-0",
    lg: "h-12 w-12 p-0",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  if (isLoading) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn(
          sizeClasses[size],
          "bg-black/40 text-white border-white/20 animate-pulse",
          className
        )}
        disabled
      >
        <Heart className={iconSizes[size]} />
      </Button>
    );
  }

  return (
    <Button
      variant={isFavorite ? "default" : "outline"}
      size="sm"
      className={cn(
        sizeClasses[size],
        isFavorite
          ? "bg-red-500 hover:bg-red-600 text-white"
          : "bg-black/40 hover:bg-black/60 text-white border-white/20",
        "transition-all duration-200",
        className
      )}
      onClick={handleToggle}
      disabled={isPending}
    >
      <Heart className={cn(iconSizes[size], isFavorite && "fill-current")} />
    </Button>
  );
}
