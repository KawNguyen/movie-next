"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FavoriteMovie {
  id: string;
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl: string | null;
  movieType: string | null;
  createdAt: string;
}

interface FavoriteStore {
  favorites: FavoriteMovie[];
  addFavorite: (movie: Omit<FavoriteMovie, "id" | "createdAt">) => void;
  removeFavorite: (movieId: string) => void;
  isFavorite: (movieId: string) => boolean;
}

export const useFavoriteStore = create<FavoriteStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (movie) =>
        set((state) => {
          if (state.favorites.some((favorite) => favorite.movieId === movie.movieId)) {
            return state;
          }

          return {
            favorites: [
              {
                ...movie,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
              },
              ...state.favorites,
            ],
          };
        }),
      removeFavorite: (movieId) =>
        set((state) => ({
          favorites: state.favorites.filter(
            (favorite) => favorite.movieId !== movieId,
          ),
        })),
      isFavorite: (movieId) =>
        get().favorites.some((favorite) => favorite.movieId === movieId),
    }),
    { name: "movie-next-favorites" },
  ),
);
