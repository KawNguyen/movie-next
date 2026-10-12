"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";

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
  syncFromServer: () => Promise<void>;
  isFavorite: (movieId: string) => boolean;
}

const requestQueues = new Map<string, Promise<void>>();

function enqueue(movieId: string, task: () => Promise<void>): Promise<void> {
  const previous = requestQueues.get(movieId) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(task);
  requestQueues.set(movieId, next);
  void next.then(
    () => {
      if (requestQueues.get(movieId) === next) requestQueues.delete(movieId);
    },
    () => {
      if (requestQueues.get(movieId) === next) requestQueues.delete(movieId);
    },
  );
  return next;
}

export const useFavoriteStore = create<FavoriteStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (movie) => {
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
        });
        enqueue(movie.movieId, async () => {
          const response = await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(movie),
          });
          if (response.status === 409) {
            set((state) => ({
              favorites: state.favorites.filter(
                (favorite) => favorite.movieId !== movie.movieId,
              ),
            }));
            toast.info("Đã đạt giới hạn danh sách yêu thích");
            return;
          }
          if (!response.ok) {
            throw new Error(`Favorite sync failed: ${response.status}`);
          }
        }).catch((error) => console.error("Favorite sync failed:", error));
      },
      removeFavorite: (movieId) => {
        set((state) => ({
          favorites: state.favorites.filter(
            (favorite) => favorite.movieId !== movieId,
          ),
        }));
        enqueue(movieId, async () => {
          const response = await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "remove", movieId }),
          });
          if (!response.ok) {
            throw new Error(`Favorite sync failed: ${response.status}`);
          }
        }).catch((error) => console.error("Favorite sync failed:", error));
      },
      syncFromServer: async () => {
        try {
          const response = await fetch("/api/favorites");
          if (!response.ok) return;
          const result = await response.json();
          if (!result.authenticated) return;
          const serverFavorites = result.data as FavoriteMovie[];
          const localFavorites = get().favorites;
          set({
            favorites: [
              ...localFavorites,
              ...serverFavorites.filter(
                (server) =>
                  !localFavorites.some(
                    (local) => local.movieId === server.movieId,
                  ),
              ),
            ],
          });
          await Promise.all(
            localFavorites.map((favorite) =>
              fetch("/api/favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(favorite),
              }),
            ),
          );
        } catch (error) {
          console.error("Favorite hydration failed:", error);
        }
      },
      isFavorite: (movieId) =>
        get().favorites.some((favorite) => favorite.movieId === movieId),
    }),
    { name: "movie-next-favorites" },
  ),
);
