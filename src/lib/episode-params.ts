import type { Server } from "@/types/movie-detail.types";
import { getServerSlug } from "./movie-url";

/**
 * Một nơi duy nhất để chuyển đổi giữa tên server (từ API) <-> slug trên URL.
 * Trước đây logic này bị lặp ở movie-detail và episode-list.
 */

export function getServerLabel(serverName: string): {
  label: string;
  kind: "sub" | "dub" | "other";
} {
  const slug = getServerSlug(serverName);
  if (slug === "vietsub") return { label: "Vietsub", kind: "sub" };
  if (slug === "thuyet-minh") return { label: "Thuyết minh", kind: "dub" };
  if (slug === "long-tieng") return { label: "Lồng tiếng", kind: "dub" };
  return { label: serverName, kind: "other" };
}

export function resolveServerIndex(
  servers: Server[],
  param: string | null,
): number {
  if (!param) return 0;
  const i = servers.findIndex((s) => getServerSlug(s.server_name) === param);
  return i >= 0 ? i : 0;
}

/** Trả về số tập hợp lệ (bắt đầu từ 1), mặc định 1. */
export function resolveTap(server: Server | undefined, param: string | null) {
  const raw = param ?? "";
  const exactIndex = server?.server_data?.findIndex((episode) => {
    const slug = episode.slug.toLowerCase();
    return slug === raw.toLowerCase() || slug.replace(/^tap-/, "") === raw;
  });
  if (exactIndex !== undefined && exactIndex >= 0) return exactIndex + 1;

  const n = Number.parseInt(raw, 10);
  const legacyN = Number.parseInt(raw.replace(/^tap-/i, ""), 10);
  const total = server?.server_data?.length ?? 0;
  const tap = Number.isFinite(n) ? n : legacyN;
  return Number.isFinite(tap) && tap >= 1 && tap <= total ? tap : 1;
}

export function getEpisodeUrlParam(slug: string): string {
  const normalized = slug.replace(/^tap-/i, "");
  return /^\d+$/.test(normalized) ? String(Number(normalized)) : slug;
}
