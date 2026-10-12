"use client";

import { useEffect, useRef, useState } from "react";
import { History, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useWatchHistoryStore } from "@/stores/watch-history-store";

export interface ResumeServer {
  serverSlug: string;
  episodes: { slug: string; name: string }[];
}

interface ResumePromptProps {
  movieId: string;
  servers: ResumeServer[];
  /** Tập đang được chọn ở WatchSection (nếu có) */
  currentEpisodeId?: string | null;
  onResume: (episodeSlug: string, serverSlug: string) => void;
}

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function ResumePrompt({
  movieId,
  servers,
  currentEpisodeId,
  onResume,
}: ResumePromptProps) {
  const hydrated = useWatchHistoryStore((s) => s.hydrated);
  const movie = useWatchHistoryStore((s) => s.movies[movieId]);
  const [dismissed, setDismissed] = useState(false);

  // Nếu user tự chọn tập khác sau khi trang đã mở -> ẩn banner
  const initialEpisodeRef = useRef(currentEpisodeId);
  useEffect(() => {
    if (currentEpisodeId !== initialEpisodeRef.current) setDismissed(true);
  }, [currentEpisodeId]);

  if (!hydrated || dismissed || !movie) return null;

  const last = movie.episodes[movie.lastEpisodeId];
  if (!last) return null;

  const server =
    servers.find((s) => s.serverSlug === last.serverSlug) ?? servers[0];
  if (!server) return null;

  // Xác định tập cần gợi ý
  let target: { slug: string; name: string } | undefined;
  let finished = false;

  if (last.completed) {
    finished = true;
    const idx = server.episodes.findIndex((e) => e.slug === last.episodeId);
    target = idx >= 0 ? server.episodes[idx + 1] : undefined;
  } else {
    target = server.episodes.find((e) => e.slug === last.episodeId);
  }

  // Đã xem hết tập cuối, hoặc tập không còn tồn tại -> không gợi ý
  if (!target) return null;

  const percent = Math.min(
    100,
    Math.round((last.progress / last.duration) * 100),
  );

  const handleResume = () => {
    onResume(target!.slug, server.serverSlug);
    setDismissed(true);
  };

  return (
    <div
      role="region"
      aria-label="Gợi ý xem tiếp"
      className="relative flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <History className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          {finished ? (
            <>
              <p className="truncate font-medium">
                Bạn vừa xem xong {last.episodeName}
              </p>
              <p className="text-sm text-muted-foreground">
                Xem tiếp {target.name}?
              </p>
            </>
          ) : (
            <>
              <p className="truncate font-medium">
                Bạn đang xem dở {last.episodeName}
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
                <Progress
                  value={percent}
                  aria-label={`Đã xem ${percent}%`}
                  className="h-1 w-24 sm:w-32"
                />
                <span className="shrink-0 tabular-nums">
                  {formatTime(last.progress)} / {formatTime(last.duration)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 gap-2 ml-auto">
        <Button size="sm" onClick={handleResume}>
          <Play className="size-4 fill-current" />
          {finished ? `Xem ${target.name}` : "Xem tiếp"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-muted-foreground"
          onClick={() => setDismissed(true)}
        >
          Để sau
        </Button>
      </div>
    </div>
  );
}
