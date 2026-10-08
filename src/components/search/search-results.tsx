"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SearchApiResponse, MovieItem } from "@/types/movie-list.types";
import { Skeleton } from "@/components/ui/skeleton";
import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchCardItem } from "./search-card-item";

export const PREVIEW_LIMIT = 12;

interface SearchResultsProps {
  query: string;
  onClose: () => void;
  isMobile?: boolean;
}

export function SearchResults({
  query,
  onClose,
  isMobile = false,
}: SearchResultsProps) {
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // query đã được debounce ở component cha => fetch thẳng, huỷ request cũ bằng AbortController
  useEffect(() => {
    const keyword = query.trim();
    if (!keyword) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=1&limit=${PREVIEW_LIMIT}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data: SearchApiResponse = await res.json();
        const items = data.status ? (data.data?.items ?? []) : [];

        setMovies(items.slice(0, PREVIEW_LIMIT));
        setTotalItems(data.data?.params?.pagination?.totalItems ?? items.length);
        setLoading(false);
      } catch (err) {
        if (controller.signal.aborted) return;
        setMovies([]);
        setTotalItems(0);
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [query]);

  const hasMore = totalItems > PREVIEW_LIMIT;
  const viewAllHref = `/tim-kiem?keyword=${encodeURIComponent(query.trim())}`;

  return (
    <div
      className={
        isMobile
          ? "h-full"
          : "absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 max-h-[500px] overflow-y-auto"
      }
    >
      <div className={isMobile ? "p-0" : "p-4"}>
        {!isMobile && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Kết quả tìm kiếm: &ldquo;{query}&rdquo;
              {totalItems > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({totalItems} kết quả)
                </span>
              )}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex space-x-3 p-3 rounded-md">
                <Skeleton className="h-24 w-16 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && movies.length > 0 && (
          <div className={isMobile ? "space-y-4" : "space-y-3"}>
            {movies.map((movie) => (
              <SearchCardItem
                key={movie._id}
                movie={movie}
                onClose={onClose}
                isMobile={isMobile}
              />
            ))}

            {hasMore && (
              <Button asChild variant="secondary" className="w-full">
                <Link href={viewAllHref} onClick={onClose}>
                  Xem thêm {totalItems - PREVIEW_LIMIT} kết quả
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        )}

        {!loading && !error && movies.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Không tìm thấy phim nào với từ khóa &ldquo;{query}&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  );
}