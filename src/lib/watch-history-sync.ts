"use client";

/**
 * Lớp mạng mỏng cho lịch sử xem. Khi đang xem, TOÀN BỘ tiến độ chỉ ghi vào localStorage.
 * Server chỉ nhận dữ liệu theo lô, ở rất ít thời điểm (xem store.pushDirty / syncFromServer).
 *
 * File này KHÔNG import store (tránh vòng lặp import).
 */

const ENDPOINT = "/api/watch-history";

/** 1 phim = 1 payload (tập đang xem + danh sách tập đã hoàn thành) */
export interface ProgressPayload {
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

/* ---------- Bật / tắt đồng bộ (do <WatchHistorySync /> điều khiển) ---------- */

let enabled = false;
export const setSyncEnabled = (value: boolean) => {
  enabled = value;
};
export const isSyncEnabled = () => enabled;

/* ---------- Player đăng ký hàm "chụp vị trí video hiện tại vào store" ---------- */

let liveSaver: (() => void) | null = null;
export const setLiveSaver = (fn: (() => void) | null) => {
  liveSaver = fn;
};
export function captureLiveProgress() {
  try {
    liveSaver?.();
  } catch {
    /* bỏ qua */
  }
}

/* ---------- Gọi API ---------- */

export type PostResult = "ok" | "unauthorized" | "error";

/** Gửi 1 lô phim. keepalive = true khi đang rời trang (giới hạn body ~64KB). */
export async function postBulk(
  items: ProgressPayload[],
  { keepalive = false }: { keepalive?: boolean } = {},
): Promise<PostResult> {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bulk", items }),
      keepalive,
    });
    if (res.status === 401) {
      enabled = false;
      return "unauthorized";
    }
    return res.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

type WatchHistoryAction =
  | { action: "remove"; movieId: string; episodeId?: string }
  | { action: "clear" };

/** Xóa phim / tập / toàn bộ. Khách chưa đăng nhập thì không gọi gì. */
export function sendWatchHistoryAction(body: WatchHistoryAction) {
  if (!enabled) return;

  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  })
    .then((res) => {
      if (res.status === 401) enabled = false;
    })
    .catch(() => {});
}