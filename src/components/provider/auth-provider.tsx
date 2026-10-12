"use client";

import { createContext, useContext, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import type { Session, User } from "@/lib/auth";
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: loading } = useSession();
  const syncFavorites = useFavoriteStore((state) => state.syncFromServer);
  const syncWatchHistory = useWatchHistoryStore(
    (state) => state.syncFromServer,
  );

  useEffect(() => {
    if (loading || !session?.user) return;
    void Promise.all([syncFavorites(), syncWatchHistory()]);
  }, [loading, session?.user, syncFavorites, syncWatchHistory]);

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
