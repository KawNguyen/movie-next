"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MovieItem } from "@/types/movie-list.types";

interface SearchCardItemProps {
  movie: MovieItem;
  onClose: () => void;
  isMobile?: boolean;
  variant?: "default" | "compact" | "detailed";
}

export function SearchCardItem({ movie, onClose }: SearchCardItemProps) {
  return (
    <Card
      className={`overflow-hidden hover:bg-muted/50 transition-colors border-0 rounded-lg p-0`}
    >
      <Link href={`/phim/${movie.slug}`} onClick={onClose}>
        <CardContent className="flex items-center gap-3 p-3">
          {/* Poster */}
          <div className="relative w-16 h-24 flex-shrink-0 rounded overflow-hidden">
            <Image
              src={`https://phimimg.com/${movie.poster_url}`}
              alt={movie.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-base text-foreground truncate">
              {movie.name}
            </h4>

            <p className="text-sm text-muted-foreground truncate">
              {movie.origin_name}
            </p>

            <p className="text-xs text-muted-foreground mt-0.5">
              {movie.year} • {movie.lang}
            </p>

            {movie.quality && (
              <span className="inline-block px-2 py-0.5 text-xs bg-primary/10 text-primary rounded mt-1">
                {movie.quality}
              </span>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
