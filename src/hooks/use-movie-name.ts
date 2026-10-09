"use client";

import { useSyncExternalStore } from "react";

import { getMovieName, subscribeToMovieSession } from "@/lib/movie-session";

export function useMovieName(slug: string | null) {
  return useSyncExternalStore(
    subscribeToMovieSession,
    () => getMovieName(slug),
    () => null,
  );
}
