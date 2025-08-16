"use server";

import {
  getFavoriteMovies,
  getFavoriteStats,
  searchFavoriteMovies,
  isFavoriteMovie,
} from "@/data/favorites";

export async function getFavoriteMoviesAction() {
  return await getFavoriteMovies();
}

export async function getFavoriteStatsAction() {
  return await getFavoriteStats();
}

export async function searchFavoriteMoviesAction(query: string) {
  return await searchFavoriteMovies(query);
}

export async function isFavoriteMovieAction(movieId: string) {
  return await isFavoriteMovie(movieId);
}
