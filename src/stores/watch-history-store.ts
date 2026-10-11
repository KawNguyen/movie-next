"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WatchHistoryItem {
  id: string;
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
  updatedAt: string;
}

interface SaveWatchProgressInput {
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

interface WatchHistoryStore {
  history: WatchHistoryItem[];
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  saveProgress: (input: SaveWatchProgressInput) => void;
  removeProgress: (movieId: string, episodeId: string) => void;
  clearHistory: () => void;
}

const MIN_REMAINING_SECONDS = 90;

export const useWatchHistoryStore = create<WatchHistoryStore>()(
  persist(
    (set) => ({
      history: [],
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      saveProgress: (input) => {
        if (
          !input.movieId ||
          !input.episodeId ||
          !input.serverSlug ||
          input.duration <= 0 ||
          input.progress < 3 ||
          input.duration - input.progress <= MIN_REMAINING_SECONDS
        ) {
          set((state) => ({
            history: state.history.filter(
              (item) =>
                !(
                  item.movieId === input.movieId &&
                  item.episodeId === input.episodeId
                ),
            ),
          }));
          return;
        }

        const item: WatchHistoryItem = {
          id: `${input.movieId}:${input.episodeId}`,
          movieId: input.movieId,
          movieSlug: input.movieSlug,
          movieName: input.movieName,
          posterUrl: input.posterUrl || null,
          thumbUrl: input.thumbUrl || null,
          episodeId: input.episodeId,
          serverSlug: input.serverSlug,
          episodeName: input.episodeName,
          progress: Math.floor(input.progress),
          duration: Math.floor(input.duration),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          history: [
            item,
            ...state.history.filter(
              (existing) =>
                existing.movieId !== item.movieId ||
                existing.episodeId !== item.episodeId,
            ),
          ],
        }));
      },
      removeProgress: (movieId, episodeId) =>
        set((state) => ({
          history: state.history.filter(
            (item) =>
              item.movieId !== movieId || item.episodeId !== episodeId,
          ),
        })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "movie-next-watch-history",
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as WatchHistoryStore;
        return {
          ...state,
          history: state.history.map((item) => ({
            ...item,
            serverSlug: item.serverSlug || "vietsub",
          })),
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
