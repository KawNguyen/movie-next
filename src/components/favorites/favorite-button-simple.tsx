"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFavoriteStore } from "@/stores/favorite-store";

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
  const [isPending, setIsPending] = useState(false);
  const isFavorite = useFavoriteStore((state) => state.isFavorite(movieId));
  const addFavorite = useFavoriteStore((state) => state.addFavorite);
  const removeFavorite = useFavoriteStore((state) => state.removeFavorite);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!movieId || typeof movieId !== "string" || !movieId.trim()) {
      toast.error("MovieId không hợp lệ");
      return;
    }

    setIsPending(true);
    if (isFavorite) {
      removeFavorite(movieId);
      toast.success("Đã xóa khỏi danh sách yêu thích");
    } else {
      addFavorite({
        movieId,
        movieSlug,
        movieName,
        posterUrl: posterUrl || null,
        movieType: movieType || null,
      });
      toast.success("Đã thêm vào danh sách yêu thích");
    }
    setIsPending(false);
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
        className,
      )}
      onClick={handleToggle}
      disabled={isPending}
    >
      <Heart className={cn(iconSizes[size], isFavorite && "fill-current")} />
    </Button>
  );
}
