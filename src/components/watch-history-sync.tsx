"use client";

import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client"; // đổi cho khớp project (better-auth client)
import { setSyncEnabled } from "@/lib/watch-history-sync";
import { useWatchHistoryStore } from "@/stores/watch-history-store";

const HIDDEN_MIN_GAP_MS = 10 * 60 * 1000;

/**
 * Điều phối việc nói chuyện với server. Gắn 1 lần trong layout gốc: <WatchHistorySync />
 *
 * KHÔNG có timer / interval nào. Request chỉ phát sinh từ sự kiện, và chỉ khi có dữ liệu
 * thay đổi chưa gửi. Tab để idle (pause, bỏ đó 15 phút hay 1 tiếng) thì không có request nào.
 *
 * - Chưa đăng nhập: không có request nào.
 * - Mở trang khi đã đăng nhập: GET (nếu > 30 phút kể từ lần kéo trước) + bulk nếu local mới hơn.
 * - Ẩn tab: đẩy phần thay đổi (nếu có), tối đa 10 phút / lần.
 * - Đóng / rời trang: đẩy phần thay đổi (nếu có).
 * (pause, hết tập, đổi tập do video-player gọi trực tiếp)
 */
export function WatchHistorySync() {
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user?.id ?? null;
  const hydrated = useWatchHistoryStore((s) => s.hydrated);
  const syncedFor = useRef<string | null>(null);

  // 1) Đồng bộ đầu phiên, một lần cho mỗi user mỗi lần tải trang
  useEffect(() => {
    if (isPending) return; // chưa biết session -> không làm gì

    if (!userId) {
      setSyncEnabled(false);
      syncedFor.current = null;
      return;
    }

    // Session đã xác nhận đăng nhập -> cho phép đẩy. Nếu session hết hạn, server trả 401
    // và lớp sync tự tắt.
    setSyncEnabled(true);

    if (!hydrated || syncedFor.current === userId) return;
    syncedFor.current = userId;
    void useWatchHistoryStore.getState().syncFromServer(userId);
  }, [isPending, userId, hydrated]);

  // 2) Đẩy phần thay đổi khi ẩn / rời trang
  useEffect(() => {
    if (!userId) return;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void useWatchHistoryStore
          .getState()
          .pushDirty({ minGapMs: HIDDEN_MIN_GAP_MS });
      }
    };
    const onPageHide = () => {
      void useWatchHistoryStore.getState().pushDirty();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [userId]);

  return null;
}