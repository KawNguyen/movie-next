// Export favorite actions
export {
  getFavoriteMoviesAction,
  getFavoriteStatsAction,
  searchFavoriteMoviesAction,
  isFavoriteMovieAction,
} from "./favorites-data";

// Export watch history actions
export {
  getWatchHistoryMoviesAction,
  getWatchHistoryStatsAction,
  getContinueWatchingMoviesAction,
  searchWatchHistoryAction,
  getWatchHistoryByMovieAction,
} from "./watch-history-data";

// Re-export types from data layer for convenience
export type { FavoriteMovie, WatchHistoryMovie } from "@/data";
