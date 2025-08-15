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
import { useTransition } from "react";

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
    <Card className="group border-1 p-0 overflow-hidden transition-all duration-300 hover:-translate-y-2 relative">
      <Link href={`/phim/${movieSlug}`}>
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
            <Badge className="absolute top-3 left-3 bg-red-500/80 text-white border-0">
              <Heart className="w-3 h-3 mr-1 fill-white" />
              Yêu thích
            </Badge>
          </AspectRatio>
        </CardHeader>
      </Link>

      <CardContent className="p-2 sm:p-3 text-center sm:text-left">
        <h3 className="font-semibold text-md md:text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {movieName}
        </h3>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(createdAt).toLocaleDateString("vi-VN")}
          </div>
          {movieType && (
            <Badge variant="outline" className="text-xs">
              {movieType === "series" ? "Phim bộ" : "Phim lẻ"}
            </Badge>
          )}
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
