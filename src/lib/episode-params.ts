import type { Server } from "@/types/movie-detail.types";
import { getServerSlug } from "./movie-url";

/**
 * Một nơi duy nhất để chuyển đổi giữa tên server (từ API) <-> slug trên URL.
 * Trước đây logic này bị lặp ở movie-detail và episode-list.
 */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function getServerLabel(serverName: string): {
  label: string;
  kind: "sub" | "dub" | "other";
} {
  const slug = getServerSlug(serverName);
  if (slug === "vietsub") return { label: "Vietsub", kind: "sub" };
  if (slug === "thuyet-minh") return { label: "Lồng tiếng", kind: "dub" };
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
  const n = Number.parseInt(param ?? "", 10);
  const total = server?.server_data?.length ?? 0;
  return Number.isFinite(n) && n >= 1 && n <= total ? n : 1;
}