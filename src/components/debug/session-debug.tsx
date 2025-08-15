"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface SessionDebugProps {
  onAuthCheck?: (isAuthenticated: boolean) => void;
}

interface DebugInfo {
  clientSession?: unknown;
  serverDebug?: unknown;
  isClientAuthenticated: boolean;
  isServerAuthenticated: boolean;
  timestamp: string;
  error?: string;
}

export function SessionDebug({ onAuthCheck }: SessionDebugProps) {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check session via better-auth client
        const session = await authClient.getSession();

        // Also check via our debug API
        const response = await fetch("/api/debug/session");
        const debugData = await response.json();

        const info = {
          clientSession: session.data,
          serverDebug: debugData,
          isClientAuthenticated: !!session.data?.user,
          isServerAuthenticated: debugData.isAuthenticated,
          timestamp: new Date().toISOString(),
        };

        setDebugInfo(info);

        // Call callback if provided
        onAuthCheck?.(!!session.data?.user);

        // Show warning if mismatch
        if (info.isClientAuthenticated !== info.isServerAuthenticated) {
          toast.error("Session mismatch detected between client and server!");
          console.error("Session mismatch:", info);
        }
      } catch (error) {
        console.error("Session check error:", error);
        setDebugInfo({
          error: error instanceof Error ? error.message : "Unknown error",
          isClientAuthenticated: false,
          isServerAuthenticated: false,
          timestamp: new Date().toISOString(),
        });
        onAuthCheck?.(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [onAuthCheck]);

  // Only show in development or when there's an issue
  if (
    process.env.NODE_ENV === "production" &&
    debugInfo?.isClientAuthenticated === debugInfo?.isServerAuthenticated
  ) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded text-xs">
        Checking session...
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-100 border border-gray-400 text-gray-700 px-4 py-2 rounded text-xs max-w-sm">
      <details>
        <summary className="cursor-pointer font-semibold">
          Session Debug {debugInfo?.isClientAuthenticated ? "✅" : "❌"}
        </summary>
        <pre className="mt-2 text-xs overflow-auto max-h-40">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </details>
    </div>
  );
}
