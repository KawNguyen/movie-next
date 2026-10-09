"use client";

import { useState } from "react";
import { UserRound, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Movie } from "@/types/movie-detail.types";

interface CastCrewProps {
  movie: Movie;
}

const VISIBLE_ACTORS = 12;

export function CastCrew({ movie }: CastCrewProps) {
  const [showAll, setShowAll] = useState(false);

  const directors = (movie.director ?? []).filter(Boolean);
  const actors = (movie.actor ?? []).filter(Boolean);
  const shown = showAll ? actors : actors.slice(0, VISIBLE_ACTORS);
  const hidden = actors.length - shown.length;

  return (
    <section className="space-y-5 rounded-xl border bg-card p-5">
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <UserRound className="size-5 text-primary" />
          Đạo diễn
        </h2>
        <ul className="flex flex-wrap gap-2">
          {directors.length ? (
            directors.map((name) => (
              <li key={name}>
                <Badge variant="outline">{name}</Badge>
              </li>
            ))
          ) : (
            <li className="text-sm text-muted-foreground">Chưa cập nhật</li>
          )}
        </ul>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <UsersRound className="size-5 text-primary" />
          Diễn viên
        </h2>
        <ul className="flex flex-wrap gap-2">
          {shown.length ? (
            shown.map((name) => (
              <li key={name}>
                <Badge variant="outline">{name}</Badge>
              </li>
            ))
          ) : (
            <li className="text-sm text-muted-foreground">Chưa cập nhật</li>
          )}
          {hidden > 0 && (
            <li>
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="rounded-full border border-dashed px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                +{hidden} diễn viên
              </button>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
