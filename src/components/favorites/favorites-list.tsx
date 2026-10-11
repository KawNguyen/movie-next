"use client";

import { useFavoriteStore } from "@/stores/favorite-store";
import { FavoriteMovieCard } from "./favorite-movie-card";
import { Button } from "@/components/ui/button";
export function FavoritesList() {
  const favorites = useFavoriteStore((state) => state.favorites);

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
      </div>

      <div className="space-y-4 md:space-y-3">
        {favorites.map((favorite) => (
          <FavoriteMovieCard
            key={favorite.movieId}
            favorite={favorite}
          />
        ))}
      </div>
    </div>
  );
}
