"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  captureLiveProgress,
  isSyncEnabled,
  postBulk,
  sendWatchHistoryAction,
  setSyncEnabled,
  type ProgressPayload,
} from "@/lib/watch-history-sync";

/* ---------- Types ---------- */

/** Tập đang xem của 1 phim */
export interface CurrentEpisode {
  episodeId: string;
  episodeName: string;
  serverSlug: string;
  progress: number; // giây; = 0 khi tập này vừa xem xong
  duration: number;
}

export interface MovieWatchState {
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl: string | null;
  thumbUrl: string | null;
  totalEpisodes: number | null;
  current: CurrentEpisode;
  /** các tập đã xem xong (theo episodeId) */
  completedEpisodeIds: string[];
  updatedAt: string;
}

export interface ContinueWatchingItem {
  movie: MovieWatchState;
  episode: CurrentEpisode;
  /** true => tập đang xem đã xong, UI nên gợi ý tập kế tiếp */
  needsNextEpisode: boolean;
  /** id tập kế tiếp (không vượt quá totalEpisodes). null nếu không có / đã hết phim */
  nextEpisodeId: string | null;
  /** true => đã xem xong tập cuối, không còn tập để gợi ý */
  finishedAll: boolean;
}

/** Tiến độ 1 tập, dùng cho danh sách tập */
export interface EpisodeProgress {
  episodeId: string;
  progress: number;
  duration: number;
  completed: boolean;
}

export interface SaveWatchProgressInput {
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl?: string;
  thumbUrl?: string;
  totalEpisodes?: number | null;
  episodeId: string;
  serverSlug: string;
  episodeName: string;
  progress: number;
  duration: number;
}

/** Dòng server trả về (1 dòng / phim) */
interface ServerRow {
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl: string | null;
  thumbUrl: string | null;
  totalEpisodes: number | null;
  episodeId: string;
  episodeName: string;
  serverSlug: string;
  progress: number;
  duration: number;
  completedEpisodes: string[];
  updatedAt: string;
}

/** Phần được lưu vào localStorage */
interface WatchHistoryState {
  movies: Record<string, MovieWatchState>;
  /** user đã đồng bộ lần cuối trên trình duyệt này (để không trộn dữ liệu 2 tài khoản) */
  syncUserId: string | null;
  /** mọi phim có updatedAt <= mốc này đã nằm trên server */
  pushedAt: string;
  /** lần cuối kéo lịch sử từ server (để không GET lại liên tục) */
  pulledAt: string;
}

interface WatchHistoryStore extends WatchHistoryState {
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  /** CHỈ ghi localStorage. Không bao giờ gọi mạng. */
  saveProgress: (input: SaveWatchProgressInput) => void;
  removeEpisode: (movieId: string, episodeId: string) => void;
  removeMovie: (movieId: string) => void;
  clearHistory: () => void;
  /**
   * Cập nhật tổng số tập của phim đã có trong lịch sử (vd dữ liệu cũ đang null).
   * KHÔNG đổi updatedAt: không đẩy phim lên đầu "Tiếp tục xem", không tự gây request.
   * Giá trị sẽ lên server cùng lần đẩy kế tiếp của phim đó.
   */
  setTotalEpisodes: (movieId: string, total: number) => void;
  /**
   * Đẩy các phim đã thay đổi (dirty) lên server bằng 1 request bulk.
   * - Không có gì thay đổi (video pause, tab idle) -> KHÔNG gọi server.
   * - minGapMs: bỏ qua nếu lần đẩy trước cách đây chưa đủ chừng đó (chống spam).
   * Không có timer / interval nào: chỉ chạy khi có sự kiện gọi tới.
   */
  pushDirty: (options?: { minGapMs?: number }) => Promise<void>;
  /** Chạy 1 lần khi đăng nhập / mở trang: kéo từ server, gộp, rồi đẩy phần local mới hơn. */
  syncFromServer: (userId: string) => Promise<void>;
}

/* ---------- Constants ---------- */

const MIN_SAVE_SECONDS = 30;
const COMPLETE_REMAINING_SECONDS = 90;
const COMPLETE_RATIO = 0.95;
const MAX_MOVIES = 50;
const MAX_COMPLETED = 2000;

const PULL_TTL_MS = 3 * 60 * 60 * 1000; // 3 giờ: mỗi lần GET là 1 lần đánh thức Neon (>= 5 phút compute)
const PUSH_CHUNK = 30; // phim có thể có hàng trăm tập hoàn thành -> chunk nhỏ cho keepalive (64KB)

let pushing = false;
let lastPushAt = 0;

/* ---------- Sync helpers ---------- */

function toPayload(movie: MovieWatchState): ProgressPayload {
  return {
    movieId: movie.movieId,
    movieSlug: movie.movieSlug,
    movieName: movie.movieName,
    posterUrl: movie.posterUrl,
    thumbUrl: movie.thumbUrl,
    totalEpisodes: movie.totalEpisodes,
    episodeId: movie.current.episodeId,
    episodeName: movie.current.episodeName || movie.current.episodeId,
    serverSlug: movie.current.serverSlug,
    progress: movie.current.progress,
    duration: movie.current.duration,
    completedEpisodes: movie.completedEpisodeIds,
    updatedAt: movie.updatedAt,
  };
}

function union(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])];
}

/** Giữ tối đa MAX_MOVIES phim mới nhất */
function limitMovies(
  movies: Record<string, MovieWatchState>,
): Record<string, MovieWatchState> {
  const ids = Object.keys(movies);
  if (ids.length <= MAX_MOVIES) return movies;
  const keep = new Set(
    ids
      .sort((a, b) => movies[b].updatedAt.localeCompare(movies[a].updatedAt))
      .slice(0, MAX_MOVIES),
  );
  const out: Record<string, MovieWatchState> = {};
  for (const id of keep) out[id] = movies[id];
  return out;
}

/** Các phim thay đổi sau mốc `since` */
function collectDirty(
  movies: Record<string, MovieWatchState>,
  since: string,
): ProgressPayload[] {
  return Object.values(movies)
    .filter((m) => m.updatedAt > since)
    .map(toPayload);
}

/** Gộp dòng từ server vào local: tập hoàn thành = union, phần "đang xem" = bản mới hơn thắng */
function mergeServerRows(
  local: Record<string, MovieWatchState>,
  rows: ServerRow[],
): Record<string, MovieWatchState> {
  const merged: Record<string, MovieWatchState> = { ...local };

  for (const row of rows) {
    const mine = merged[row.movieId];
    const fromServer: MovieWatchState = {
      movieId: row.movieId,
      movieSlug: row.movieSlug,
      movieName: row.movieName,
      posterUrl: row.posterUrl,
      thumbUrl: row.thumbUrl,
      totalEpisodes: row.totalEpisodes,
      current: {
        episodeId: row.episodeId,
        episodeName: row.episodeName,
        serverSlug: row.serverSlug,
        progress: row.progress,
        duration: row.duration,
      },
      completedEpisodeIds: row.completedEpisodes,
      updatedAt: row.updatedAt,
    };

    if (!mine) {
      merged[row.movieId] = fromServer;
      continue;
    }

    const [newer, older] =
      row.updatedAt > mine.updatedAt ? [fromServer, mine] : [mine, fromServer];

    merged[row.movieId] = {
      ...newer,
      posterUrl: newer.posterUrl ?? older.posterUrl,
      thumbUrl: newer.thumbUrl ?? older.thumbUrl,
      totalEpisodes: newer.totalEpisodes ?? older.totalEpisodes,
      completedEpisodeIds: union(
        older.completedEpisodeIds,
        newer.completedEpisodeIds,
      ),
    };
  }

  return limitMovies(merged);
}

/* ---------- Store ---------- */

export const useWatchHistoryStore = create<WatchHistoryStore>()(
  persist(
    (set, get) => ({
      movies: {},
      syncUserId: null,
      pushedAt: "",
      pulledAt: "",
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

        const completed =
          input.duration - input.progress <= COMPLETE_REMAINING_SECONDS ||
          input.progress / input.duration >= COMPLETE_RATIO;
        const progress = completed ? 0 : Math.floor(input.progress); // xong thì reset về 0
        const duration = Math.floor(input.duration);
        const totalEpisodes = input.totalEpisodes ?? null;

        // Không có gì thay đổi -> không ghi, không đổi updatedAt (không thành "dirty")
        const prev = get().movies[input.movieId];
        if (
          prev &&
          prev.current.episodeId === input.episodeId &&
          prev.current.progress === progress &&
          prev.current.duration === duration &&
          (!completed || prev.completedEpisodeIds.includes(input.episodeId)) &&
          (totalEpisodes === null || prev.totalEpisodes === totalEpisodes)
        ) {
          return;
        }

        const now = new Date().toISOString();

        set((state) => {
          const old = state.movies[input.movieId];

          let completedEpisodeIds = old?.completedEpisodeIds ?? [];
          if (completed && !completedEpisodeIds.includes(input.episodeId)) {
            completedEpisodeIds = [...completedEpisodeIds, input.episodeId].slice(
              -MAX_COMPLETED,
            );
          }

          const movie: MovieWatchState = {
            movieId: input.movieId,
            movieSlug: input.movieSlug,
            movieName: input.movieName,
            posterUrl: input.posterUrl || old?.posterUrl || null,
            thumbUrl: input.thumbUrl || old?.thumbUrl || null,
            totalEpisodes: totalEpisodes ?? old?.totalEpisodes ?? null,
            current: {
              episodeId: input.episodeId,
              episodeName: input.episodeName,
              serverSlug: input.serverSlug,
              progress,
              duration,
            },
            completedEpisodeIds,
            updatedAt: now,
          };

          return {
            movies: limitMovies({ ...state.movies, [movie.movieId]: movie }),
          };
        });
      },

      // Bỏ 1 tập khỏi danh sách đã xem
      removeEpisode: (movieId, episodeId) => {
        set((state) => {
          const movie = state.movies[movieId];
          if (!movie || !movie.completedEpisodeIds.includes(episodeId)) {
            return state;
          }

          const completedEpisodeIds = movie.completedEpisodeIds.filter(
            (e) => e !== episodeId,
          );
          const isCurrent = movie.current.episodeId === episodeId;

          // Không còn gì để giữ -> xóa luôn phim
          if (isCurrent && completedEpisodeIds.length === 0) {
            const { [movieId]: _removed, ...rest } = state.movies;
            return { movies: rest };
          }

          return {
            movies: {
              ...state.movies,
              [movieId]: {
                ...movie,
                completedEpisodeIds,
                current: isCurrent
                  ? { ...movie.current, progress: 0 }
                  : movie.current,
              },
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

      setTotalEpisodes: (movieId, total) => {
        if (!Number.isInteger(total) || total <= 0) return;
        set((state) => {
          const movie = state.movies[movieId];
          if (!movie || movie.totalEpisodes === total) return state;
          return {
            movies: { ...state.movies, [movieId]: { ...movie, totalEpisodes: total } },
          };
        });
      },

      clearHistory: () => {
        set({ movies: {} });
        sendWatchHistoryAction({ action: "clear" });
      },

      pushDirty: async ({ minGapMs = 0 } = {}) => {
        if (!isSyncEnabled() || pushing) return;
        if (minGapMs > 0 && Date.now() - lastPushAt < minGapMs) return;

        // Chụp vị trí video hiện tại vào store trước khi gom
        captureLiveProgress();

        const startedAt = new Date().toISOString();
        const dirty = collectDirty(get().movies, get().pushedAt);
        if (dirty.length === 0) return; // idle / không có gì mới -> KHÔNG gọi server

        pushing = true;
        try {
          for (let i = 0; i < dirty.length; i += PUSH_CHUNK) {
            const result = await postBulk(dirty.slice(i, i + PUSH_CHUNK), {
              keepalive: true,
            });
            // Lỗi: giữ nguyên mốc, KHÔNG hẹn giờ thử lại. Lần có sự kiện kế tiếp sẽ gửi lại
            // (server union tập hoàn thành và bỏ qua phần "đang xem" cũ hơn).
            if (result !== "ok") return;
          }
          lastPushAt = Date.now();
          set({ pushedAt: startedAt });
        } finally {
          pushing = false;
        }
      },

      syncFromServer: async (userId) => {
        try {
          // Đổi tài khoản trên cùng trình duyệt -> bỏ dữ liệu local của người trước
          const { syncUserId } = get();
          if (syncUserId && syncUserId !== userId) {
            set({ movies: {}, pushedAt: "", pulledAt: "", syncUserId: null });
          }

          // Cùng tài khoản và vừa kéo chưa lâu -> khỏi GET lại, chỉ đẩy phần còn thay đổi
          const { pulledAt } = get();
          if (
            get().syncUserId === userId &&
            pulledAt &&
            Date.now() - Date.parse(pulledAt) < PULL_TTL_MS
          ) {
            await get().pushDirty();
            return;
          }

          const response = await fetch("/api/watch-history", {
            cache: "no-store",
          });
          if (!response.ok) return;

          const result = await response.json();
          if (!result.authenticated) {
            setSyncEnabled(false);
            return;
          }
          setSyncEnabled(true);

          const rows = result.data as ServerRow[];
          const local = get().movies;
          const startedAt = new Date().toISOString();

          // 1) kéo: gộp server vào local
          set({ movies: mergeServerRows(local, rows), syncUserId: userId });

          // 2) đẩy: phim local chưa có trên server / mới hơn / có tập hoàn thành mà server chưa có
          const serverIndex = new Map(
            rows.map((r) => [
              r.movieId,
              { at: r.updatedAt, done: new Set(r.completedEpisodes) },
            ]),
          );
          const uploads: ProgressPayload[] = [];
          for (const movie of Object.values(local)) {
            const s = serverIndex.get(movie.movieId);
            if (
              !s ||
              movie.updatedAt > s.at ||
              movie.completedEpisodeIds.some((e) => !s.done.has(e))
            ) {
              uploads.push(toPayload(movie));
            }
          }

          for (let i = 0; i < uploads.length; i += PUSH_CHUNK) {
            const res = await postBulk(uploads.slice(i, i + PUSH_CHUNK));
            if (res !== "ok") return;
          }

          lastPushAt = Date.now();
          set({ pushedAt: startedAt, pulledAt: startedAt });
        } catch (error) {
          console.error("Watch history sync failed:", error);
        }
      },
    }),
    {
      name: "movie-next-watch-history",
      version: 3,

      partialize: (state): WatchHistoryState => ({
        movies: state.movies,
        syncUserId: state.syncUserId,
        pushedAt: state.pushedAt,
        pulledAt: state.pulledAt,
      }),

      migrate: (persisted: unknown, version) => {
        // Reset mốc đồng bộ để lần mở trang sau kéo + đẩy lại toàn bộ theo mô hình mới
        const fresh = (
          movies: Record<string, MovieWatchState>,
          syncUserId: string | null,
        ): WatchHistoryState => ({
          movies,
          syncUserId,
          pushedAt: "",
          pulledAt: "",
        });

        // v1: history phẳng theo từng tập
        if (version < 2) {
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

          const items = [...(old?.history ?? [])].sort((a, b) =>
            a.updatedAt.localeCompare(b.updatedAt),
          );
          const movies: Record<string, MovieWatchState> = {};
          for (const it of items) {
            // item mới nhất ghi đè cuối cùng
            movies[it.movieId] = {
              movieId: it.movieId,
              movieSlug: it.movieSlug,
              movieName: it.movieName,
              posterUrl: it.posterUrl,
              thumbUrl: it.thumbUrl,
              totalEpisodes: null,
              current: {
                episodeId: it.episodeId,
                episodeName: it.episodeName,
                serverSlug: it.serverSlug || "vietsub",
                progress: it.progress,
                duration: it.duration,
              },
              completedEpisodeIds: [],
              updatedAt: it.updatedAt,
            };
          }
          return fresh(movies, null);
        }

        // v2: movies[].episodes (record) + lastEpisodeId -> current + completedEpisodeIds
        if (version < 3) {
          type V2Episode = {
            episodeId: string;
            serverSlug: string;
            episodeName: string;
            progress: number;
            duration: number;
            completed: boolean;
            updatedAt: string;
          };
          type V2Movie = {
            movieId: string;
            movieSlug: string;
            movieName: string;
            posterUrl: string | null;
            thumbUrl: string | null;
            lastEpisodeId: string;
            updatedAt: string;
            episodes: Record<string, V2Episode>;
          };
          const old = persisted as {
            movies?: Record<string, V2Movie>;
            syncUserId?: string | null;
          } | null;

          const movies: Record<string, MovieWatchState> = {};
          for (const m of Object.values(old?.movies ?? {})) {
            const eps = Object.values(m.episodes ?? {});
            const cur =
              m.episodes?.[m.lastEpisodeId] ??
              [...eps].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
            if (!cur) continue;

            movies[m.movieId] = {
              movieId: m.movieId,
              movieSlug: m.movieSlug,
              movieName: m.movieName,
              posterUrl: m.posterUrl,
              thumbUrl: m.thumbUrl,
              totalEpisodes: null,
              current: {
                episodeId: cur.episodeId,
                episodeName: cur.episodeName,
                serverSlug: cur.serverSlug,
                progress: cur.progress,
                duration: cur.duration,
              },
              completedEpisodeIds: eps
                .filter((e) => e.completed)
                .map((e) => e.episodeId),
              updatedAt: m.updatedAt,
            };
          }
          return fresh(movies, old?.syncUserId ?? null);
        }

        return (persisted as WatchHistoryState) ?? fresh({}, null);
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

/** Tập đang xem đã xong và đứng yên ở 0 => cần gợi ý tập kế tiếp */
function needsNext(movie: MovieWatchState): boolean {
  return (
    movie.current.progress === 0 &&
    movie.completedEpisodeIds.includes(movie.current.episodeId)
  );
}

/** "tap-5" -> 5. null nếu id không kết thúc bằng số */
export function getEpisodeNumber(episodeId: string): number | null {
  const m = episodeId.match(/(\d+)$/);
  return m ? Number(m[1]) : null;
}

/** "tap-5" -> "tap-6", "tap-09" -> "tap-10" (giữ số 0 đệm). null nếu không suy ra được */
export function getNextEpisodeId(episodeId: string): string | null {
  const m = episodeId.match(/^(.*?)(\d+)$/);
  if (!m) return null;
  const next = String(Number(m[2]) + 1);
  return m[1] + (m[2].startsWith("0") ? next.padStart(m[2].length, "0") : next);
}

/**
 * Tập kế tiếp cần gợi ý sau khi xem xong tập hiện tại.
 * Trả null nếu tập hiện tại chưa xong, hoặc đã là tập cuối (n >= totalEpisodes).
 */
export function selectNextEpisodeId(movie: MovieWatchState): string | null {
  if (!needsNext(movie)) return null;
  const n = getEpisodeNumber(movie.current.episodeId);
  if (n === null) return null;
  if (movie.totalEpisodes && n >= movie.totalEpisodes) return null;
  return getNextEpisodeId(movie.current.episodeId);
}

/** Danh sách "Tiếp tục xem": mỗi phim 1 card, mới nhất lên đầu */
export function selectContinueWatching(
  movies: Record<string, MovieWatchState>,
): ContinueWatchingItem[] {
  return Object.values(movies)
    .map((movie) => {
      const needsNextEpisode = needsNext(movie);
      const nextEpisodeId = selectNextEpisodeId(movie);
      return {
        movie,
        episode: movie.current,
        needsNextEpisode,
        nextEpisodeId,
        finishedAll: needsNextEpisode && nextEpisodeId === null,
      };
    })
    .sort((a, b) => b.movie.updatedAt.localeCompare(a.movie.updatedAt));
}

/** Tiến độ 1 tập (dùng ở player / danh sách tập). undefined nếu chưa xem */
export function selectEpisodeProgress(
  movies: Record<string, MovieWatchState>,
  movieId: string,
  episodeId: string,
): EpisodeProgress | undefined {
  const movie = movies[movieId];
  if (!movie) return undefined;
  const completed = movie.completedEpisodeIds.includes(episodeId);

  if (movie.current.episodeId === episodeId) {
    return {
      episodeId,
      progress: movie.current.progress,
      duration: movie.current.duration,
      completed,
    };
  }
  return completed
    ? { episodeId, progress: 0, duration: 0, completed: true }
    : undefined;
}

/** Danh sách tập đã xem xong (hiện dấu tick) */
export function selectWatchedEpisodeIds(
  movies: Record<string, MovieWatchState>,
  movieId: string,
): Set<string> {
  return new Set(movies[movieId]?.completedEpisodeIds ?? []);
}

/** Số tập đã xem / tổng số tập, phục vụ thanh tiến độ phim bộ */
export function selectMovieProgress(movie: MovieWatchState): {
  watched: number;
  total: number | null;
  percent: number | null;
} {
  const watched = movie.completedEpisodeIds.length;
  const total = movie.totalEpisodes;
  return {
    watched,
    total,
    percent:
      total && total > 0 ? Math.min(100, Math.round((watched / total) * 100)) : null,
  };
}

/**
 * Chọn tập mặc định khi vào trang phim.
 * - Chưa xem gì          -> null (UI tự chọn tập đầu)
 * - Tập đang dở          -> chính tập đó
 * - Tập đang xem đã xong -> tập kế tiếp trong `orderedEpisodeIds` (không có thì giữ nguyên)
 */
export function selectResumeEpisodeId(
  movies: Record<string, MovieWatchState>,
  movieId: string,
  orderedEpisodeIds: string[],
): string | null {
  const movie = movies[movieId];
  if (!movie) return null;
  if (!needsNext(movie)) return movie.current.episodeId;

  const idx = orderedEpisodeIds.indexOf(movie.current.episodeId);
  if (idx === -1) return movie.current.episodeId;

  // Không vượt quá tổng số tập
  const nextIdx = idx + 1;
  if (movie.totalEpisodes && nextIdx >= movie.totalEpisodes) {
    return movie.current.episodeId;
  }
  return orderedEpisodeIds[nextIdx] ?? movie.current.episodeId;
}