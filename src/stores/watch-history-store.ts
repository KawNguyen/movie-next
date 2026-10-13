"use client";

import { ProgressPayload, queueProgress, sendWatchHistoryAction, setSyncAuth, uploadWatchHistoryBulk } from "@/lib/watch-history-sync";
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

interface ServerRow {
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
}

interface WatchHistoryState {
  movies: Record<string, MovieWatchState>;
}

interface WatchHistoryStore extends WatchHistoryState {
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  /**
   * Lưu local ngay. Lên server thì thưa (xem watch-history-sync.ts).
   * options.flush = true: gửi sớm (pause, ẩn tab, đóng tab, đổi tập, ended).
   */
  saveProgress: (
    input: SaveWatchProgressInput,
    options?: { flush?: boolean },
  ) => void;
  removeEpisode: (movieId: string, episodeId: string) => void;
  removeMovie: (movieId: string) => void;
  clearHistory: () => void;
  /** force = true: bỏ qua cache phiên, dùng sau khi đăng nhập / đăng xuất */
  syncFromServer: (options?: { force?: boolean }) => Promise<void>;
}

/* ---------- Constants ---------- */

const MIN_SAVE_SECONDS = 3;
const COMPLETE_REMAINING_SECONDS = 90;
const COMPLETE_RATIO = 0.95;
const MAX_MOVIES = 50;

const SYNC_CACHE_KEY = "movie-next-watch-history:sync";
const SYNC_TTL_MS = 10 * 60 * 1000;

/* ---------- Sync helpers ---------- */

function readSyncCache(): { t: number; auth: boolean } | null {
  try {
    const raw = sessionStorage.getItem(SYNC_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSyncCache(auth: boolean) {
  try {
    sessionStorage.setItem(
      SYNC_CACHE_KEY,
      JSON.stringify({ t: Date.now(), auth }),
    );
  } catch {
    /* sessionStorage không dùng được: bỏ qua */
  }
}

function toPayload(movie: MovieWatchState, ep: EpisodeProgress): ProgressPayload {
  return {
    movieId: movie.movieId,
    movieSlug: movie.movieSlug,
    movieName: movie.movieName,
    posterUrl: movie.posterUrl,
    thumbUrl: movie.thumbUrl,
    episodeId: ep.episodeId,
    serverSlug: ep.serverSlug,
    episodeName: ep.episodeName || ep.episodeId,
    progress: ep.progress,
    duration: ep.duration,
    completed: ep.completed,
    updatedAt: ep.updatedAt,
  };
}

/** Gộp các dòng phẳng từ server vào store (mỗi tập: bản updatedAt mới hơn thắng) */
function mergeServerRows(
  local: Record<string, MovieWatchState>,
  rows: ServerRow[],
): Record<string, MovieWatchState> {
  const merged: Record<string, MovieWatchState> = {};
  for (const [id, m] of Object.entries(local)) {
    merged[id] = { ...m, episodes: { ...m.episodes } };
  }

  for (const row of rows) {
    let movie = merged[row.movieId];
    if (!movie) {
      movie = merged[row.movieId] = {
        movieId: row.movieId,
        movieSlug: row.movieSlug,
        movieName: row.movieName,
        posterUrl: row.posterUrl,
        thumbUrl: row.thumbUrl,
        lastEpisodeId: row.episodeId,
        updatedAt: row.updatedAt,
        episodes: {},
      };
    }

    const current = movie.episodes[row.episodeId];
    if (!current || row.updatedAt > current.updatedAt) {
      movie.episodes[row.episodeId] = {
        episodeId: row.episodeId,
        serverSlug: row.serverSlug,
        episodeName: row.episodeName,
        progress: row.progress,
        duration: row.duration,
        completed: row.completed,
        updatedAt: row.updatedAt,
      };
      // metadata phim lấy từ bản ghi mới nhất
      if (row.updatedAt > movie.updatedAt) {
        movie.movieSlug = row.movieSlug;
        movie.movieName = row.movieName;
        movie.posterUrl = row.posterUrl ?? movie.posterUrl;
        movie.thumbUrl = row.thumbUrl ?? movie.thumbUrl;
      }
    }
  }

  // Tính lại tập gần nhất + thời điểm cập nhật của từng phim
  for (const movie of Object.values(merged)) {
    let latest: EpisodeProgress | undefined;
    for (const ep of Object.values(movie.episodes)) {
      if (!latest || ep.updatedAt > latest.updatedAt) latest = ep;
    }
    if (latest) {
      movie.lastEpisodeId = latest.episodeId;
      movie.updatedAt = latest.updatedAt;
    }
  }

  // Giới hạn số phim
  const ids = Object.keys(merged);
  if (ids.length > MAX_MOVIES) {
    const keep = new Set(
      ids
        .sort((a, b) => merged[b].updatedAt.localeCompare(merged[a].updatedAt))
        .slice(0, MAX_MOVIES),
    );
    for (const id of Object.keys(merged)) if (!keep.has(id)) delete merged[id];
  }

  return merged;
}

/* ---------- Store ---------- */

export const useWatchHistoryStore = create<WatchHistoryStore>()(
  persist(
    (set, get) => ({
      movies: {},
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),

      saveProgress: (input, options) => {
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

        // Lên server: gom + gửi thưa (khách chưa đăng nhập thì không gửi gì)
        queueProgress(
          {
            movieId: input.movieId,
            movieSlug: input.movieSlug,
            movieName: input.movieName,
            posterUrl: input.posterUrl || null,
            thumbUrl: input.thumbUrl || null,
            episodeId: input.episodeId,
            serverSlug: input.serverSlug,
            episodeName: input.episodeName || input.episodeId,
            progress: Math.floor(input.progress),
            duration: Math.floor(input.duration),
            completed,
            updatedAt: now,
          },
          options?.flush,
        );
      },

      // Xóa 1 tập (vd: user bấm "bỏ khỏi lịch sử")
      removeEpisode: (movieId, episodeId) => {
        set((state) => {
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
        });
        sendWatchHistoryAction({ action: "remove", movieId, episodeId });
      },

      removeMovie: (movieId) => {
        set((state) => {
          if (!state.movies[movieId]) return state;
          const { [movieId]: _removed, ...rest } = state.movies;
          return { movies: rest };
        });
        sendWatchHistoryAction({ action: "remove", movieId });
      },

      clearHistory: () => {
        set({ movies: {} });
        sendWatchHistoryAction({ action: "clear" });
      },

      syncFromServer: async ({ force = false } = {}) => {
        // Mỗi phiên chỉ hỏi server ~10 phút/lần; vẫn phải báo trạng thái đăng nhập
        // cho hàng đợi, nếu không tiến độ sẽ bị giữ lại mãi.
        if (!force) {
          const cache = readSyncCache();
          if (cache && Date.now() - cache.t < SYNC_TTL_MS) {
            setSyncAuth(cache.auth);
            return;
          }
        }

        try {
          const response = await fetch("/api/watch-history", {
            cache: "no-store",
          });
          if (!response.ok) return;

          const result = await response.json();
          const authenticated = Boolean(result.authenticated);
          setSyncAuth(authenticated);
          writeSyncCache(authenticated);
          if (!authenticated) return;

          const rows = result.data as ServerRow[];
          const local = get().movies;

          // 1) kéo: gộp server vào local
          set({ movies: mergeServerRows(local, rows) });

          // 2) đẩy: chỉ những tập local mới hơn / chưa có trên server, gói thành bulk
          const serverIndex = new Map(
            rows.map((r) => [`${r.movieId}:${r.episodeId}`, r.updatedAt]),
          );
          const uploads: ProgressPayload[] = [];
          for (const movie of Object.values(local)) {
            for (const ep of Object.values(movie.episodes)) {
              const serverAt = serverIndex.get(`${movie.movieId}:${ep.episodeId}`);
              if (!serverAt || ep.updatedAt > serverAt) {
                uploads.push(toPayload(movie, ep));
              }
            }
          }
          if (uploads.length > 0) await uploadWatchHistoryBulk(uploads);
        } catch (error) {
          console.error("Watch history sync failed:", error);
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