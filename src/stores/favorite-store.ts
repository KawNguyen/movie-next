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

interface FavoriteState {
  favorites: FavoriteMovie[];
  /** tài khoản đã đồng bộ lần cuối trên trình duyệt này (tránh trộn yêu thích của 2 tài khoản) */
  syncUserId: string | null;
  /** lần cuối kéo từ server (để không GET lại liên tục) */
  pulledAt: string;
}

interface FavoriteStore extends FavoriteState {
  addFavorite: (movie: Omit<FavoriteMovie, "id" | "createdAt">) => void;
  removeFavorite: (movieId: string) => void;
  /** Gọi 1 lần khi đăng nhập / mở trang. Truyền userId để không trộn dữ liệu giữa các tài khoản. */
  syncFromServer: (userId?: string) => Promise<void>;
  isFavorite: (movieId: string) => boolean;
}

const MAX_FAVORITES = 500;
const BULK_CHUNK = 100;
const PULL_TTL_MS = 3 * 60 * 60 * 1000; // 3 giờ

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
      syncUserId: null,
      pulledAt: "",

      addFavorite: (movie) => {
        set((state) => {
          if (state.favorites.some((f) => f.movieId === movie.movieId)) {
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
                (f) => f.movieId !== movie.movieId,
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
          favorites: state.favorites.filter((f) => f.movieId !== movieId),
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

      syncFromServer: async (userId) => {
        try {
          const uid = userId ?? null;

          // Đổi tài khoản trên cùng trình duyệt -> bỏ yêu thích local của người trước
          const { syncUserId } = get();
          if (syncUserId && uid && syncUserId !== uid) {
            set({ favorites: [], syncUserId: null, pulledAt: "" });
          }

          // Vừa đồng bộ cách đây chưa lâu -> khỏi GET lại (mỗi lần GET là 1 lần đánh thức Neon)
          const { pulledAt } = get();
          if (
            get().syncUserId === uid &&
            pulledAt &&
            Date.now() - Date.parse(pulledAt) < PULL_TTL_MS
          ) {
            return;
          }

          const response = await fetch("/api/favorites", { cache: "no-store" });
          if (!response.ok) return;
          const result = await response.json();
          if (!result.authenticated) return;

          const startedAt = new Date().toISOString();
          const serverFavorites = result.data as FavoriteMovie[];
          const localFavorites = get().favorites;
          const serverIds = new Set(serverFavorites.map((f) => f.movieId));
          const localIds = new Set(localFavorites.map((f) => f.movieId));

          // 1) kéo: gộp server vào local (mới nhất lên đầu)
          const merged = [
            ...localFavorites,
            ...serverFavorites.filter((s) => !localIds.has(s.movieId)),
          ]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, MAX_FAVORITES);
          set({ favorites: merged, syncUserId: uid });

          // 2) đẩy: chỉ những phim local mà server chưa có, gộp thành vài request bulk
          const missing = localFavorites
            .filter((f) => !serverIds.has(f.movieId))
            .map(({ id: _id, ...rest }) => rest);

          for (let i = 0; i < missing.length; i += BULK_CHUNK) {
            const res = await fetch("/api/favorites", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "bulk",
                items: missing.slice(i, i + BULK_CHUNK),
              }),
            });
            if (!res.ok) return; // lần sau thử lại
          }

          set({ pulledAt: startedAt });
        } catch (error) {
          console.error("Favorite hydration failed:", error);
        }
      },

      isFavorite: (movieId) =>
        get().favorites.some((f) => f.movieId === movieId),
    }),
    {
      name: "movie-next-favorites",
      partialize: (state): FavoriteState => ({
        favorites: state.favorites,
        syncUserId: state.syncUserId,
        pulledAt: state.pulledAt,
      }),
    },
  ),
);