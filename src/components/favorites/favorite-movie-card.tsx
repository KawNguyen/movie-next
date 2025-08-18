"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Heart, Trash2 } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { removeFromFavorites } from "@/actions/favorites";
import { toast } from "sonner";
import { useTransition, useState, useEffect } from "react";

interface FavoriteMovieCardProps {
  id: string;
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl: string | null;
  movieType: string | null;
  createdAt: Date;
  onRemove?: (movieId: string) => void;
}

export function FavoriteMovieCard({
  movieId,
  movieSlug,
  movieName,
  posterUrl,
  movieType,
  createdAt,
  onRemove,
}: FavoriteMovieCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatDate = (date: Date) => {
    if (!isMounted) {
      return date.toISOString().split("T")[0];
    }
    return date.toLocaleDateString("vi-VN");
  };

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return "/placeholder-movie.jpg";
    if (imagePath.startsWith("http")) return imagePath;
    return `https://phimimg.com/${imagePath}`;
  };

  const handleRemove = async () => {
    startTransition(async () => {
      try {
        const result = await removeFromFavorites(movieId);
        if (result.success) {
          toast.success("Đã xóa khỏi danh sách yêu thích");
          onRemove?.(movieId);
        } else {
          toast.error(result.error || "Không thể xóa khỏi danh sách yêu thích");
        }
      } catch (error) {
        toast.error("Có lỗi xảy ra");
        console.error("Error removing favorite:", error);
      }
    });
  };

  return (
    <Card
      className="group border-1 p-0 overflow-hidden transition-all duration-300 hover:-translate-y-2 relative flex flex-col md:flex-row md:h-40"
    >
      {/* Mobile: Vertical Layout | Desktop: Left side image */}
      <Link
        href={`/phim/${movieSlug}`}
        className="w-full md:w-48 flex-shrink-0"
      >
        <CardHeader className="p-0">
          <AspectRatio
            ratio={2 / 3}
            className="relative overflow-hidden w-full md:aspect-[3/2] md:h-40"
          >
            <Image
              src={getImageUrl(posterUrl)}
              alt={movieName}
              fill
              sizes="(max-width: 768px) 100vw, 200px"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Badge className="absolute top-3 left-3 bg-red-500/80 text-white border-0">
              <Heart className="w-3 h-3 mr-1 fill-white" />
              Yêu thích
            </Badge>
          </AspectRatio>
        </CardHeader>
      </Link>

      {/* Mobile: Bottom content | Desktop: Right side content */}
      <CardContent className="p-2 sm:p-3 text-center sm:text-left md:flex-1 md:flex md:flex-col md:justify-between md:text-left">
        <div>
          <Link href={`/phim/${movieSlug}`}>
            <h3 className="font-semibold text-md md:text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors md:line-clamp-3">
              {movieName}
            </h3>
          </Link>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2 md:flex-col md:items-start md:gap-2">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(new Date(createdAt))}
            </div>
            {movieType && (
              <Badge variant="outline" className="text-xs">
                {movieType === "series" ? "Phim bộ" : "Phim lẻ"}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      {/* Remove button - responsive positioning */}
      <Button
        size="sm"
        variant="destructive"
        className="absolute top-2 right-2 h-8 w-8 p-0"
        onClick={handleRemove}
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </Card>
  );
}
