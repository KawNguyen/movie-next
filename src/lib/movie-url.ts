/**
 * Helper functions để xử lý URL params cho movie detail
 */

import { slugify } from "./utils";

export const getServerSlug = (serverName: string): string => {
  const slug = slugify(serverName);
  if (slug.toLowerCase().includes("vietsub")) {
    return "vietsub";
  }
  if (
    slug.toLowerCase().includes("lồng tiếng") ||
    slug.toLowerCase().includes("long-tieng")
  ) {
    return "long-tieng";
  }
  if (
    slug.toLowerCase().includes("thuyết minh") ||
    slug.toLowerCase().includes("thuyet-minh")
  ) {
    return "thuyet-minh";
  }
  return "vietsub"; // default
};

export const getServerDisplayName = (serverName: string) => {
  if (serverName.toLowerCase().includes("vietsub")) {
    return "Vietsub";
  }
  if (
    serverName.toLowerCase().includes("lồng tiếng") ||
    serverName.toLowerCase().includes("thuyết minh")
  ) {
    return "Thuyết minh";
  }
  return serverName;
};

export const buildMovieUrl = (
  baseSlug: string,
  episode?: number,
  server?: string,
): string => {
  const params = new URLSearchParams();

  if (episode) {
    params.set("tap", episode.toString());
  }

  if (server) {
    params.set("server", server);
  }

  const queryString = params.toString();
  return `/phim/${baseSlug}${queryString ? `?${queryString}` : ""}`;
};

export const parseMovieUrl = (searchParams: URLSearchParams) => {
  const tap = searchParams.get("tap");
  const server = searchParams.get("server");

  return {
    episode: tap ? parseInt(tap) : null,
    server: server || null,
  };
};
