"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SearchApiResponse, MovieItem } from "@/types/movie-list.types";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchCardItem } from "./search-card-item";

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
  const [allMovies, setAllMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || query.trim().length < 1) {
      setAllMovies([]);
      setCurrentPage(1);
      setHasMore(true);
      setTotalItems(0);
      setError(null);
      return;
    }
    setAllMovies([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
  }, [query]);

  const fetchResults = useCallback(
    async (page: number = 1, isLoadMore: boolean = false) => {
      if (!query || query.trim().length < 1) return;

      if (!isLoadMore) setLoading(true);
      else setLoadingMore(true);

      setError(null);

      try {
        const url = `/api/tim-kiem?keyword=${encodeURIComponent(
          query
        )}&page=${page}`;
        const response = await fetch(url);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data: SearchApiResponse = await response.json();

        if (data.status && data.data?.items) {
          setAllMovies((prev) =>
            isLoadMore
              ? [...prev, ...(data.data?.items ?? [])]
              : data.data?.items ?? []
          );
          setTotalItems(data.data.params?.pagination?.totalItems || 0);
          setCurrentPage(page);

          const totalPages = data.data.params?.pagination?.totalPages || 1;
          setHasMore(page < totalPages);
        } else {
          if (!isLoadMore) setAllMovies([]);
          setHasMore(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
        if (!isLoadMore) setAllMovies([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [query]
  );

  useEffect(() => {
    if (!query || query.trim().length < 1) {
      setAllMovies([]);
      setCurrentPage(1);
      setHasMore(true);
      setTotalItems(0);
      setError(null);
      return;
    }
    const timeoutId = setTimeout(() => {
      fetchResults(1, false);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query, fetchResults]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchResults(currentPage + 1, true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: isMobile ? "20px" : "10px",
      }
    );
    const currentObserverRef = observerRef.current;
    if (currentObserverRef) observer.observe(currentObserverRef);
    return () => {
      if (currentObserverRef) observer.unobserve(currentObserverRef);
    };
  }, [hasMore, loading, loadingMore, currentPage, fetchResults, isMobile]);

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

        {loading && allMovies.length === 0 && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex space-x-3 p-3 bg-primary-foreground rounded-md border-primary"
              >
                <Skeleton className="h-20 w-16 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
          </div>
        )}

        {!loading && allMovies.length > 0 && (
          <div className={isMobile ? "space-y-4" : "space-y-3"}>
            {allMovies.map((movie) => (
              <SearchCardItem
                key={movie._id}
                movie={movie}
                onClose={onClose}
                isMobile={isMobile}
              />
            ))}
            <div ref={observerRef} className={isMobile ? "h-8 w-full" : "h-4"}>
              {loadingMore && (
                <div
                  className={`flex items-center justify-center ${
                    isMobile ? "py-6" : "py-4"
                  }`}
                >
                  <Loader2
                    className={`${
                      isMobile ? "h-5 w-5" : "h-4 w-4"
                    } animate-spin mr-2`}
                  />
                  <span
                    className={`${
                      isMobile ? "text-base" : "text-sm"
                    } text-muted-foreground`}
                  >
                    Đang tải thêm...
                  </span>
                </div>
              )}
              {!hasMore && allMovies.length > 0 && (
                <div
                  className={`text-center ${
                    isMobile ? "py-6" : "py-4"
                  } text-muted-foreground`}
                >
                  <span className={isMobile ? "text-base" : "text-sm"}>
                    Đã hiển thị tất cả kết quả
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading &&
          !error &&
          allMovies.length === 0 &&
          query.trim().length >= 1 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Không tìm thấy phim nào với từ khóa &ldquo;{query}&rdquo;</p>
            </div>
          )}
      </div>
    </div>
  );
}
