"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Headphones, Play, ScrollText, Subtitles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Movie, Server } from "@/types/movie-detail.types";
import { getServerLabel } from "@/lib/episode-params";

interface EpisodeListProps {
  movie: Movie;
  episodes: Server[];
  activeServer: number;
  activeTap: number;
  pending?: boolean;
  onSelect: (serverIndex: number, tap: number) => void;
}

const ICONS = { sub: Subtitles, dub: Headphones, other: Play } as const;

/**
 * "Tập 1" -> "1", "Tập 01" -> "1", "Tập 1a" -> "1a", "Full" -> "Full"
 * Nếu bỏ tiền tố mà rỗng thì giữ nguyên tên gốc.
 */
function getEpisodeLabel(name: string): string {
  const label = name
    .replace(/^\s*(tập|tap|episode|ep)\b\.?\s*/i, "")
    .replace(/^0+(?=\d)/, "")
    .trim();
  return label || name;
}

function EpisodeListBase({
  movie,
  episodes,
  activeServer,
  activeTap,
  pending,
  onSelect,
}: EpisodeListProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const server = episodes[activeServer];

  // Event delegation: 1 handler cho cả trăm nút thay vì 1 closure / nút
  const handleGridClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
        "button[data-tap]",
      );
      if (!btn) return;
      const tap = Number(btn.dataset.tap);
      if (tap) onSelect(activeServer, tap);
    },
    [activeServer, onSelect],
  );

  // Tự cuộn tới tập đang xem
  useEffect(() => {
    gridRef.current
      ?.querySelector('[aria-current="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [activeServer, activeTap]);

  // Chỉ render server đang chọn (trước đây render tất cả TabsContent)
  const tiles = useMemo(
    () =>
      (server?.server_data ?? []).map((ep, i) => {
        const tap = i + 1;
        const selected = tap === activeTap;
        return (
          <button
            key={ep.slug}
            type="button"
            data-tap={tap}
            aria-current={selected}
            title={ep.name}
            aria-label={ep.name}
            className={`h-10 truncate rounded-md border px-2 text-xs font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted"
            }`}
          >
            {getEpisodeLabel(ep.name)}
          </button>
        );
      }),
    [server, activeTap],
  );

  const completed = movie.status === "completed";

  return (
    <aside className="flex min-h-0 flex-col rounded-xl border bg-card lg:h-full">
      <div className="space-y-2 px-4 pt-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-semibold">
            <ScrollText className="size-5 text-primary" />
            Danh sách tập phim
          </h2>
          <Badge variant={completed ? "default" : "secondary"}>
            {completed ? "Hoàn thành" : "Đang cập nhật"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {movie.episode_total} tập
        </p>

        {episodes.length > 1 && (
          <div
            role="tablist"
            aria-label="Chọn phiên bản"
            className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-muted p-1"
          >
            {episodes.map((s, i) => {
              const { label, kind } = getServerLabel(s.server_name);
              const Icon = ICONS[kind];
              const selected = i === activeServer;
              return (
                <button
                  key={s.server_name}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => !selected && onSelect(i, 1)}
                  className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selected
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <ScrollArea className="mt-3 h-72 shrink-0 lg:h-auto lg:min-h-0 lg:flex-1 [&>[data-radix-scroll-area-viewport]>div]:!block">
        <div
          ref={gridRef}
          onClick={handleGridClick}
          className={`grid grid-cols-5 content-start gap-2 px-4 pb-4 sm:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 ${
            pending ? "opacity-70" : ""
          }`}
        >
          {tiles}
        </div>
      </ScrollArea>
    </aside>
  );
}

export const EpisodeList = memo(EpisodeListBase);