"use client";

export const NAME_MOVIE_SESSION_KEY = "name-movie-session";
export const MOVIE_SESSION_CHANGE_EVENT = "movie-session-change";

export interface MovieSession {
  slug: string;
  name: string;
}

function getMovieSession(): MovieSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedMovie = sessionStorage.getItem(NAME_MOVIE_SESSION_KEY);

  if (!storedMovie) {
    return null;
  }

  try {
    return JSON.parse(storedMovie) as MovieSession;
  } catch {
    return null;
  }
}

export function getMovieName(slug: string | null): string | null {
  if (!slug) {
    return null;
  }

  const movie = getMovieSession();

  return movie?.slug === slug ? movie.name : null;
}

export function setMovieName(slug: string, name: string) {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(
    NAME_MOVIE_SESSION_KEY,
    JSON.stringify({
      slug,
      name,
    } satisfies MovieSession),
  );

  window.dispatchEvent(new Event(MOVIE_SESSION_CHANGE_EVENT));
}

export function subscribeToMovieSession(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(MOVIE_SESSION_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(MOVIE_SESSION_CHANGE_EVENT, onChange);
  };
}