"use client";

/**
 * Hàng đợi đẩy tiến độ xem lên server, thiết kế cho Vercel/Neon free:
 *  - Lưu local thì thoải mái, còn gửi server thì thưa (mặc định 1 lần / 60s).
 *  - Gom theo từng tập: chỉ gửi bản mới nhất.
 *  - Khách chưa đăng nhập: không gửi gì (không còn spam 401).
 *  - Không gửi lại nếu tiến độ không đổi.
 *  - Khi ẩn tab / đóng tab / đổi tập: gửi ngay bằng fetch keepalive.
 *
 * File này KHÔNG import store (tránh vòng lặp import).
 */

const ENDPOINT = "/api/watch-history";
const FLUSH_INTERVAL_MS = 60_000;
const MIN_GAP_MS = 10_000; // 2 lần gửi "ngay" cách nhau tối thiểu (khi tab đang hiện)
const MAX_FAILURES = 3;
const BULK_CHUNK = 200;

export interface ProgressPayload {
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
  completed: boolean;
  updatedAt: string;
}

type AuthState = "unknown" | "yes" | "no";

let authState: AuthState = "unknown";
const pending = new Map<string, ProgressPayload>();
const lastSent = new Map<string, string>();
let timer: ReturnType<typeof setTimeout> | null = null;
let timerDue = 0;
let lastFlushAt = 0;
let failures = 0;

const keyOf = (p: { movieId: string; episodeId: string }) =>
  `${p.movieId}:${p.episodeId}`;
const sigOf = (p: ProgressPayload) => `${p.progress}:${p.completed}`;

function clearTimer() {
  if (timer) clearTimeout(timer);
  timer = null;
  timerDue = 0;
}

function schedule(delay: number) {
  if (authState !== "yes") return;
  const due = Date.now() + delay;
  if (timer && timerDue <= due) return; // đã có hẹn sớm hơn
  clearTimer();
  timerDue = due;
  timer = setTimeout(() => {
    timer = null;
    timerDue = 0;
    void flushWatchHistory();
  }, delay);
}

/** Gọi sau khi biết user đã đăng nhập hay chưa (kết quả của GET /api/watch-history) */
export function setSyncAuth(authenticated: boolean) {
  authState = authenticated ? "yes" : "no";
  if (!authenticated) {
    pending.clear();
    lastSent.clear();
    clearTimer();
    return;
  }
  if (pending.size > 0) void flushWatchHistory();
}

/**
 * Đưa tiến độ vào hàng đợi.
 * immediate = true cho các thời điểm quan trọng (pause, ẩn tab, đóng tab, đổi tập, ended).
 */
export function queueProgress(payload: ProgressPayload, immediate = false) {
  if (authState === "no") return;

  pending.set(keyOf(payload), payload);

  // Chưa biết đã đăng nhập chưa -> giữ lại, sẽ gửi khi setSyncAuth(true)
  if (authState === "unknown") return;

  if (!immediate) {
    schedule(FLUSH_INTERVAL_MS);
    return;
  }

  // Tab đang hiện mà vừa gửi xong thì dời lại một chút (chống bấm pause/play liên tục).
  // Tab đang ẩn / đóng thì phải gửi ngay, nếu không sẽ mất.
  const visible =
    typeof document !== "undefined" && document.visibilityState === "visible";
  const wait = visible ? MIN_GAP_MS - (Date.now() - lastFlushAt) : 0;

  if (wait > 0) {
    schedule(wait);
    return;
  }
  void flushWatchHistory();
}

export async function flushWatchHistory() {
  clearTimer();
  if (authState !== "yes" || pending.size === 0) return;

  const items = [...pending.values()].filter(
    (p) => lastSent.get(keyOf(p)) !== sigOf(p),
  );
  pending.clear();
  if (items.length === 0) return;

  lastFlushAt = Date.now();
  // Đánh dấu trước khi gửi để các sự kiện đến gần nhau (pause + visibilitychange)
  // không gửi trùng; lỗi thì hoàn tác bên dưới.
  items.forEach((p) => lastSent.set(keyOf(p), sigOf(p)));

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        items.length === 1 ? items[0] : { action: "bulk", items },
      ),
      keepalive: true, // vẫn gửi được khi trang đang đóng
    });

    if (res.status === 401) {
      setSyncAuth(false);
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    failures = 0;
  } catch {
    // Mạng lỗi / 5xx: trả lại hàng đợi (không đè bản mới hơn), thử lại sau
    for (const p of items) {
      lastSent.delete(keyOf(p));
      if (!pending.has(keyOf(p))) pending.set(keyOf(p), p);
    }
    if (++failures <= MAX_FAILURES) schedule(FLUSH_INTERVAL_MS);
  }
}

type WatchHistoryAction =
  | { action: "remove"; movieId: string; episodeId?: string }
  | { action: "clear" };

/** Xóa phim / tập / toàn bộ. Đồng thời bỏ các bản đang chờ gửi của phần bị xóa. */
export function sendWatchHistoryAction(body: WatchHistoryAction) {
  if (body.action === "clear") {
    pending.clear();
    lastSent.clear();
  } else {
    for (const k of [...pending.keys()]) {
      const [movieId, episodeId] = k.split(":");
      if (movieId === body.movieId && (!body.episodeId || episodeId === body.episodeId)) {
        pending.delete(k);
        lastSent.delete(k);
      }
    }
  }

  if (authState !== "yes") return;

  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  })
    .then((res) => {
      if (res.status === 401) setSyncAuth(false);
    })
    .catch(() => {});
}

/** Đẩy nhiều tập một lần (dùng khi gộp dữ liệu local lên server sau đăng nhập) */
export async function uploadWatchHistoryBulk(items: ProgressPayload[]) {
  for (let i = 0; i < items.length; i += BULK_CHUNK) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "bulk",
        items: items.slice(i, i + BULK_CHUNK),
      }),
    });
    if (!res.ok) return false;
  }
  return true;
}