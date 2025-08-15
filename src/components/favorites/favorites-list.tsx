"use client";

import { useEffect, useState } from "react";
import { getFavorites } from "@/actions/favorites";
import { FavoriteMovieCard } from "./favorite-movie-card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Favorite {
  id: string;
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl: string | null;
  movieType: string | null;
  createdAt: Date;
}

export function FavoritesList() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const result = await getFavorites();
      if (result.success) {
        setFavorites(result.data || []);
      } else {
        toast.error(result.error || "Không thể tải danh sách yêu thích");
      }
    } catch {
      toast.error("Có lỗi xảy ra khi tải danh sách yêu thích");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRemoveFavorite = (movieId: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.movieId !== movieId));
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="aspect-[2/3] bg-muted rounded-lg mb-2" />
            <div className="h-4 bg-muted rounded mb-1" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💔</div>
        <h3 className="text-lg font-medium mb-2">Chưa có phim yêu thích</h3>
        <p className="text-muted-foreground mb-4">
          Hãy thêm những bộ phim yêu thích của bạn vào danh sách này
        </p>
        <Button onClick={() => window.history.back()}>Khám phá phim mới</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Phim yêu thích ({favorites.length})
        </h1>
        <Button variant="outline" size="sm" onClick={loadFavorites}>
          Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {favorites.map((favorite) => (
          <FavoriteMovieCard
            key={favorite.id}
            id={favorite.id}
            movieId={favorite.movieId}
            movieSlug={favorite.movieSlug}
            movieName={favorite.movieName}
            posterUrl={favorite.posterUrl}
            movieType={favorite.movieType}
            createdAt={favorite.createdAt}
            onRemove={handleRemoveFavorite}
          />
        ))}
      </div>
    </div>
  );
}
