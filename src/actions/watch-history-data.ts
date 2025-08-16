"use server";

import {
  getWatchHistoryMovies,
  getWatchHistoryStats,
  getContinueWatchingMovies,
  searchWatchHistory,
  getWatchHistoryByMovie,
} from "@/data/watch-history";

export async function getWatchHistoryMoviesAction() {
  return await getWatchHistoryMovies();
}

export async function getWatchHistoryStatsAction() {
  return await getWatchHistoryStats();
}

export async function getContinueWatchingMoviesAction(limit?: number) {
  return await getContinueWatchingMovies(limit);
}

export async function searchWatchHistoryAction(query: string) {
  return await searchWatchHistory(query);
}

export async function getWatchHistoryByMovieAction(movieId: string) {
  return await getWatchHistoryByMovie(movieId);
}
