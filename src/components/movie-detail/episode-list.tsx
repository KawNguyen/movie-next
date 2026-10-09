"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import type { MouseEvent } from "react";

import { Headphones, Play, ScrollText, Subtitles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const ICONS = {
  sub: Subtitles,
  dub: Headphones,
  other: Play,
} as const;

/**
 * "Tập 1"  -> "1"
 * "Tập 01" -> "1"
 * "Tập 1a" -> "1a"
 * "Full" -> "Full"
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

  // Chọn server mới thì chuyển sang tập 1.
  const handleServerChange = useCallback(
    (value: string) => {
      const serverIndex = Number(value);

      if (
        !Number.isInteger(serverIndex) ||
        serverIndex < 0 ||
        serverIndex >= episodes.length ||
        serverIndex === activeServer
      ) {
        return;
      }

      onSelect(serverIndex, 1);
    },
    [activeServer, episodes.length, onSelect],
  );

  // Event delegation: một handler cho toàn bộ danh sách tập.
  const handleGridClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
        "button[data-tap]",
      );

      if (!btn || pending) return;

      const tap = Number(btn.dataset.tap);

      if (Number.isInteger(tap) && tap > 0) {
        onSelect(activeServer, tap);
      }
    },
    [activeServer, onSelect, pending],
  );

  // Tự cuộn đến tập đang xem.
  useEffect(() => {
    gridRef.current
      ?.querySelector('[aria-current="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [activeServer, activeTap]);

  // Chỉ render tập của server đang chọn.
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
            aria-current={selected ? "true" : undefined}
            title={ep.name}
            aria-label={ep.name}
            disabled={pending}
            className={`h-10 truncate rounded-md border px-2 text-xs font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed ${
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted"
            }`}
          >
            {getEpisodeLabel(ep.name)}
          </button>
        );
      }),
    [server, activeTap, pending],
  );

  const completed = movie.status === "completed";

  const currentServerLabel = episodes[activeServer]?.server_name ?? "";

  return (
    <aside className="flex min-h-0 flex-col rounded-xl border bg-card lg:h-full">
      <div className="space-y-3 px-4 pt-3">
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
          <Select
            value={String(activeServer)}
            onValueChange={handleServerChange}
            disabled={pending}
          >
            <SelectTrigger
              className="w-full"
              aria-label="Chọn server phát phim"
            >
              <SelectValue placeholder="Chọn server">
                {currentServerLabel}
              </SelectValue>
            </SelectTrigger>

            <SelectContent>
              {episodes.map((s, i) => {
                const { label, kind } = getServerLabel(s.server_name);
                const Icon = ICONS[kind];

                return (
                  <SelectItem key={`${s.server_name}-${i}`} value={String(i)}>
                    <span className="flex items-center gap-2">
                      <Icon className="size-4 shrink-0" />
                      <span>{label}</span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>

      <ScrollArea className="mt-3 h-72 shrink-0 lg:h-auto lg:min-h-0 lg:flex-1 [&>[data-radix-scroll-area-viewport]>div]:!block">
        <div
          ref={gridRef}
          onClick={handleGridClick}
          aria-busy={pending}
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
