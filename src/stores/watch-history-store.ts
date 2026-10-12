"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ---------- Types ---------- */

export interface EpisodeProgress {
  episodeId: string;
  serverSlug: string;
  episodeName: string;
  progress: number; // giây; = 0 khi đã xem xong
  duration: number;
  completed: boolean;
  updatedAt: string;
}

export interface MovieWatchState {
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl: string | null;
  thumbUrl: string | null;
  lastEpisodeId: string; // tập xem gần nhất
  updatedAt: string;
  episodes: Record<string, EpisodeProgress>; // key = episodeId
}

export interface ContinueWatchingItem {
  movie: MovieWatchState;
  episode: EpisodeProgress;
  /** true => tập cuối đã xem xong, UI nên gợi ý tập kế tiếp */
  needsNextEpisode: boolean;
}

export interface SaveWatchProgressInput {
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl?: string;
  thumbUrl?: string;
  episodeId: string;
  serverSlug: string;
  episodeName: string;
  progress: number;
  duration: number;
}

interface WatchHistoryState {
  movies: Record<string, MovieWatchState>;
}

interface WatchHistoryStore extends WatchHistoryState {
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  saveProgress: (input: SaveWatchProgressInput) => void;
  removeEpisode: (movieId: string, episodeId: string) => void;
  removeMovie: (movieId: string) => void;
  clearHistory: () => void;
  syncFromServer: () => Promise<void>;
}

/* ---------- Constants ---------- */

const MIN_SAVE_SECONDS = 3;
const COMPLETE_REMAINING_SECONDS = 90;
const COMPLETE_RATIO = 0.95;
const MAX_MOVIES = 50;

/* ---------- Store ---------- */

export const useWatchHistoryStore = create<WatchHistoryStore>()(
  persist(
    (set, get) => ({
      movies: {},
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),

      saveProgress: (input) => {
        // Dữ liệu không hợp lệ -> bỏ qua, KHÔNG xóa tiến độ cũ
        if (
          !input.movieId ||
          !input.episodeId ||
          !input.serverSlug ||
          !Number.isFinite(input.duration) ||
          !Number.isFinite(input.progress) ||
          input.duration <= 0 ||
          input.progress < MIN_SAVE_SECONDS
        ) {
          return;
        }

        const now = new Date().toISOString();
        const completed =
          input.duration - input.progress <= COMPLETE_REMAINING_SECONDS ||
          input.progress / input.duration >= COMPLETE_RATIO;

        set((state) => {
          const prev = state.movies[input.movieId];

          const episode: EpisodeProgress = {
            episodeId: input.episodeId,
            serverSlug: input.serverSlug,
            episodeName: input.episodeName,
            // xem xong thì reset về 0 để lần sau xem lại từ đầu
            progress: completed ? 0 : Math.floor(input.progress),
            duration: Math.floor(input.duration),
            completed,
            updatedAt: now,
          };

          const movie: MovieWatchState = {
            movieId: input.movieId,
            movieSlug: input.movieSlug,
            movieName: input.movieName,
            posterUrl: input.posterUrl || prev?.posterUrl || null,
            thumbUrl: input.thumbUrl || prev?.thumbUrl || null,
            lastEpisodeId: input.episodeId,
            updatedAt: now,
            episodes: { ...prev?.episodes, [input.episodeId]: episode },
          };

          let movies = { ...state.movies, [movie.movieId]: movie };

          // Giới hạn số phim, bỏ phim cũ nhất
          const ids = Object.keys(movies);
          if (ids.length > MAX_MOVIES) {
            const oldest = [...ids].sort((a, b) =>
              movies[a].updatedAt.localeCompare(movies[b].updatedAt),
            )[0];
            const { [oldest]: _removed, ...rest } = movies;
            movies = rest;
          }

          return { movies };
        });
        void fetch("/api/watch-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...input,
            progress: Math.floor(input.progress),
            duration: Math.floor(input.duration),
            completed,
            updatedAt: now,
          }),
        }).catch((error) =>
          console.error("Watch history sync failed:", error),
        );
      },

      // Xóa 1 tập (vd: user bấm "bỏ khỏi lịch sử")
      removeEpisode: (movieId, episodeId) =>
        (set((state) => {
          const movie = state.movies[movieId];
          if (!movie || !movie.episodes[episodeId]) return state;

          const { [episodeId]: _removed, ...episodes } = movie.episodes;
          const remaining = Object.values(episodes);

          // Hết tập nào thì xóa luôn phim
          if (remaining.length === 0) {
            const { [movieId]: _m, ...rest } = state.movies;
            return { movies: rest };
          }

          // Nếu xóa đúng tập gần nhất -> lùi về tập có updatedAt mới nhất còn lại
          const lastEpisodeId =
            movie.lastEpisodeId === episodeId
              ? remaining.sort((a, b) =>
                  b.updatedAt.localeCompare(a.updatedAt),
                )[0].episodeId
              : movie.lastEpisodeId;

          return {
            movies: {
              ...state.movies,
              [movieId]: { ...movie, episodes, lastEpisodeId },
            },
          };
        }),
        void fetch("/api/watch-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "remove", movieId, episodeId }),
        }).catch((error) =>
          console.error("Watch history sync failed:", error),
        )),

      removeMovie: (movieId) =>
        (set((state) => {
          if (!state.movies[movieId]) return state;
          const { [movieId]: _removed, ...rest } = state.movies;
          return { movies: rest };
        }),
        void fetch("/api/watch-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "remove", movieId }),
        }).catch((error) =>
          console.error("Watch history sync failed:", error),
        )),

      clearHistory: () => {
        set({ movies: {} });
        void fetch("/api/watch-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "clear" }),
        }).catch((error) =>
          console.error("Watch history sync failed:", error),
        );
      },
      syncFromServer: async () => {
        try {
          const response = await fetch("/api/watch-history");
          if (!response.ok) return;
          const result = await response.json();
          if (!result.authenticated) return;

          const serverHistory = result.data as Array<{
            movieId: string;
            movieSlug: string;
            movieName: string;
            posterUrl: string | null;
            thumbUrl: string | null;
            episodeId: string;
            serverSlug: string;
            episodeName: string;
            progress: number;
            duration: number;
            completed: boolean;
            updatedAt: string;
          }>;
          const localMovies = get().movies;
          const merged = { ...localMovies };

          for (const item of serverHistory) {
            const localMovie = merged[item.movieId];
            const localEpisode = localMovie?.episodes[item.episodeId];
            if (
              !localEpisode ||
              item.updatedAt > localEpisode.updatedAt
            ) {
              merged[item.movieId] = {
                movieId: item.movieId,
                movieSlug: item.movieSlug,
                movieName: item.movieName,
                posterUrl: item.posterUrl,
                thumbUrl: item.thumbUrl,
                lastEpisodeId: localMovie?.lastEpisodeId || item.episodeId,
                updatedAt: item.updatedAt,
                episodes: {
                  ...localMovie?.episodes,
                  [item.episodeId]: {
                    episodeId: item.episodeId,
                    serverSlug: item.serverSlug,
                    episodeName: item.episodeName,
                    progress: item.progress,
                    duration: item.duration,
                    completed: item.completed,
                    updatedAt: item.updatedAt,
                  },
                },
              };
            }
          }
          set({ movies: merged });

          const uploads = Object.values(localMovies).flatMap((movie) =>
            Object.values(movie.episodes).map((episode) =>
              fetch("/api/watch-history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  movieId: movie.movieId,
                  movieSlug: movie.movieSlug,
                  movieName: movie.movieName,
                  posterUrl: movie.posterUrl,
                  thumbUrl: movie.thumbUrl,
                  ...episode,
                }),
              }),
            ),
          );
          await Promise.all(uploads);
        } catch (error) {
          console.error("Watch history hydration failed:", error);
        }
      },
    }),
    {
      name: "movie-next-watch-history",
      version: 2,

      // Không persist `hydrated` và các action
      partialize: (state): WatchHistoryState => ({ movies: state.movies }),

      migrate: (persisted: unknown, version) => {
        // v1: history phẳng theo từng tập -> gom về theo phim
        const old = persisted as {
          history?: Array<{
            movieId: string;
            movieSlug: string;
            movieName: string;
            posterUrl: string | null;
            thumbUrl: string | null;
            episodeId: string;
            serverSlug?: string;
            episodeName: string;
            progress: number;
            duration: number;
            updatedAt: string;
          }>;
        } | null;

        if (version < 2) {
          const items = [...(old?.history ?? [])].sort((a, b) =>
            a.updatedAt.localeCompare(b.updatedAt),
          );
          const movies: Record<string, MovieWatchState> = {};

          for (const it of items) {
            const prev = movies[it.movieId];
            movies[it.movieId] = {
              movieId: it.movieId,
              movieSlug: it.movieSlug,
              movieName: it.movieName,
              posterUrl: it.posterUrl,
              thumbUrl: it.thumbUrl,
              lastEpisodeId: it.episodeId, // item mới nhất ghi đè cuối cùng
              updatedAt: it.updatedAt,
              episodes: {
                ...prev?.episodes,
                [it.episodeId]: {
                  episodeId: it.episodeId,
                  serverSlug: it.serverSlug || "vietsub",
                  episodeName: it.episodeName,
                  progress: it.progress,
                  duration: it.duration,
                  completed: false,
                  updatedAt: it.updatedAt,
                },
              },
            };
          }
          return { movies } satisfies WatchHistoryState;
        }

        return (persisted as WatchHistoryState) ?? { movies: {} };
      },

      onRehydrateStorage: () => (state, error) => {
        if (error) console.error("Watch history rehydrate failed:", error);
        // Luôn set hydrated, kể cả khi lỗi, để UI không bị treo
        state?.setHydrated(true);
      },
    },
  ),
);

/* ---------- Selectors / helpers ---------- */

/** Danh sách "Tiếp tục xem": mỗi phim 1 card, mới nhất lên đầu */
export function selectContinueWatching(
  movies: Record<string, MovieWatchState>,
): ContinueWatchingItem[] {
  return Object.values(movies)
    .map((movie) => {
      const episode = movie.episodes[movie.lastEpisodeId];
      return episode
        ? { movie, episode, needsNextEpisode: episode.completed }
        : null;
    })
    .filter((x): x is ContinueWatchingItem => x !== null)
    .sort((a, b) => b.movie.updatedAt.localeCompare(a.movie.updatedAt));
}

/** Dùng ở player/danh sách tập để lấy tiến độ 1 tập */
export function selectEpisodeProgress(
  movies: Record<string, MovieWatchState>,
  movieId: string,
  episodeId: string,
): EpisodeProgress | undefined {
  return movies[movieId]?.episodes[episodeId];
}

/** Dùng ở danh sách tập: tập nào đã xem xong để hiện dấu tick */
export function selectWatchedEpisodeIds(
  movies: Record<string, MovieWatchState>,
  movieId: string,
): Set<string> {
  const eps = movies[movieId]?.episodes ?? {};
  return new Set(
    Object.values(eps)
      .filter((e) => e.completed)
      .map((e) => e.episodeId),
  );
}

/**
 * Chọn tập mặc định khi vào trang phim.
 * - Chưa xem gì          -> null (để UI tự chọn tập đầu)
 * - Tập cuối đang dở     -> chính tập đó
 * - Tập cuối đã xong     -> tập kế tiếp trong `orderedEpisodeIds` (nếu có),
 *                           không có tập kế thì giữ nguyên tập đó
 */
export function selectResumeEpisodeId(
  movies: Record<string, MovieWatchState>,
  movieId: string,
  orderedEpisodeIds: string[],
): string | null {
  const movie = movies[movieId];
  if (!movie) return null;

  const last = movie.episodes[movie.lastEpisodeId];
  if (!last) return null;
  if (!last.completed) return last.episodeId;

  const idx = orderedEpisodeIds.indexOf(last.episodeId);
  if (idx === -1) return last.episodeId;
  return orderedEpisodeIds[idx + 1] ?? last.episodeId;
}