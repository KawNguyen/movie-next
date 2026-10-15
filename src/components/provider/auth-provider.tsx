"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import type { Session, User } from "@/lib/auth";
import { setSyncEnabled } from "@/lib/watch-history-sync";
import { useFavoriteStore } from "@/stores/favorite-store";
import { useWatchHistoryStore } from "@/stores/watch-history-store";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
});

const HIDDEN_MIN_GAP_MS = 10 * 60 * 1000;

/** Chờ store persist nạp xong từ localStorage (thường đã xong ngay khi có mặt trên client) */
function whenHydrated(
  persist: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void },
  fn: () => void,
) {
  if (persist.hasHydrated()) return fn();
  const unsub = persist.onFinishHydration(() => {
    unsub();
    fn();
  });
}

/**
 * Cung cấp session và điều phối đồng bộ lịch sử xem / yêu thích với server.
 *
 * KHÔNG có timer / interval nào. Request chỉ phát sinh từ sự kiện, và chỉ khi có dữ liệu
 * thay đổi chưa gửi.
 *
 * - Chưa đăng nhập: không có request nào.
 * - Mở trang khi đã đăng nhập: GET lịch sử + yêu thích (mỗi loại chỉ khi > 3 giờ kể từ lần kéo
 *   trước, xem PULL_TTL_MS trong store) + bulk nếu local mới hơn. Chỉ 1 lần cho mỗi user mỗi lần tải trang.
 * - Ẩn tab: đẩy phần thay đổi (nếu có), tối đa 10 phút / lần.
 * - Đóng / rời trang: đẩy phần thay đổi (nếu có).
 * (pause, hết tập, đổi tập do video-player gọi trực tiếp)
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: loading } = useSession();
  // Dùng id (chuỗi) thay vì object user để effect không chạy lại mỗi lần session được tải lại
  const userId = session?.user?.id ?? null;
  const syncedFor = useRef<string | null>(null);

  // 1) Đồng bộ đầu phiên: một lần cho mỗi user mỗi lần tải trang
  useEffect(() => {
    if (loading) return; // chưa biết session -> không làm gì

    if (!userId) {
      setSyncEnabled(false);
      syncedFor.current = null;
      return;
    }

    // Session đã xác nhận đăng nhập -> cho phép đẩy. Nếu session hết hạn, server trả 401
    // và lớp sync tự tắt.
    setSyncEnabled(true);

    if (syncedFor.current === userId) return;
    syncedFor.current = userId;

    // Chờ cả hai store nạp xong localStorage rồi mới đồng bộ (tránh ghi đè dữ liệu local)
    whenHydrated(useWatchHistoryStore.persist, () => {
      void useWatchHistoryStore.getState().syncFromServer(userId);
    });
    whenHydrated(useFavoriteStore.persist, () => {
      void useFavoriteStore.getState().syncFromServer(userId);
    });
  }, [loading, userId]);

  // 2) Đẩy phần thay đổi của lịch sử xem khi ẩn / rời trang
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

  return (
    <AuthContext.Provider
      value={{
        session: session || null,
        user: session?.user || null,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}