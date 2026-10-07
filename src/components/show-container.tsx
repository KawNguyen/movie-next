"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  CategoryApiResponse,
  MovieItem,
  MovieListParams,
} from "@/types/movie-list.types";
import MovieFilter from "./movie-filter";
import MovieList from "./movie-list";

type Pagination = {
  totalItems: number;
  totalItemsPerPage: number;
  currentPage: number;
  totalPages: number;
};

interface ShowContainerProps {
  slug: string;
  apiEndpoint?: "danh-muc" | "the-loai" | "quoc-gia";
  initialData?: CategoryApiResponse | null;
  // Giữ lại để các page cũ không lỗi type, nhưng không còn dùng:
  // URL (useSearchParams) mới là nguồn dữ liệu duy nhất.
  searchParams?: unknown;
}

const PAGE_TYPE = {
  "the-loai": "genre",
  "quoc-gia": "country",
  "danh-muc": "category",
} as const;

function parseParams(sp: URLSearchParams): MovieListParams {
  const num = (key: string) => {
    const v = sp.get(key);
    const n = v ? parseInt(v, 10) : NaN;
    return Number.isNaN(n) ? undefined : n;
  };

  return {
    page: num("page") ?? 1,
    sort_field: (sp.get("sort_field") as MovieListParams["sort_field"]) ?? undefined,
    sort_type: (sp.get("sort_type") as MovieListParams["sort_type"]) ?? undefined,
    sort_lang: (sp.get("sort_lang") as MovieListParams["sort_lang"]) ?? undefined,
    category: sp.get("category") ?? undefined,
    country: sp.get("country") ?? undefined,
    year: num("year"),
    limit: num("limit"),
  };
}

function toQueryString(params: MovieListParams, omitFirstPage: boolean) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (omitFirstPage && key === "page" && value === 1) return;
    q.append(key, String(value));
  });
  return q.toString();
}

export default function ShowContainer({
  slug,
  apiEndpoint = "danh-muc",
  initialData = null,
}: ShowContainerProps) {
  const urlParams = useSearchParams();

  // Nguồn dữ liệu duy nhất: URL. Back/Forward tự hoạt động.
  const filters = useMemo(() => parseParams(urlParams), [urlParams]);
  const requestKey = `${slug}?${toQueryString(filters, true)}`;

  const [movies, setMovies] = useState<MovieItem[]>(
    initialData?.data?.items ?? [],
  );
  const [pagination, setPagination] = useState<Pagination | null>(
    initialData?.data?.params?.pagination ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  // Dữ liệu từ server ứng với URL ban đầu => không cần fetch lại
  const lastKeyRef = useRef<string | null>(initialData ? requestKey : null);

  const loadMovies = useCallback(
    async (params: MovieListParams) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/${apiEndpoint}/${slug}?${toQueryString(params, false)}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("Không thể tải danh sách phim");

        const json: CategoryApiResponse = await res.json();
        const ok =
          (json.status === "success" || json.status === true) && json.data;
        if (!ok) throw new Error(json.msg || "API trả về lỗi");

        setMovies(json.data.items);
        setPagination(json.data.params.pagination);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
      } finally {
        if (abortRef.current === controller) setLoading(false);
      }
    },
    [apiEndpoint, slug],
  );

  // URL đổi => fetch (bỏ qua lần đầu vì đã có initialData)
  useEffect(() => {
    if (lastKeyRef.current === requestKey) return;
    lastKeyRef.current = requestKey;
    loadMovies(filters);
  }, [requestKey, filters, loadMovies]);

  // Huỷ request đang chạy khi rời trang
  useEffect(() => () => abortRef.current?.abort(), []);

  // Chỉ việc đổi URL, effect phía trên lo phần fetch
  const updateUrl = useCallback(
    (next: MovieListParams) => {
      const qs = toQueryString(next, true);
      window.history.pushState(
        null,
        "",
        qs ? `/${apiEndpoint}/${slug}?${qs}` : `/${apiEndpoint}/${slug}`,
      );
    },
    [apiEndpoint, slug],
  );

  const handlePageChange = (page: number) => {
    updateUrl({ ...filters, page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <MovieFilter
        onFilterChange={updateUrl}
        loading={loading}
        initialFilters={filters}
        pageType={PAGE_TYPE[apiEndpoint] ?? "default"}
        currentSlug={slug}
      />

      {error ? (
        <div className="py-10 text-center">
          <p className="mb-4 text-sm text-red-500">{error}</p>
          <Button variant="outline" size="sm" onClick={() => loadMovies(filters)}>
            Thử lại
          </Button>
        </div>
      ) : (
        <MovieList
          loading={loading}
          movies={movies}
          pagination={
            pagination
              ? {
                  currentPage: pagination.currentPage,
                  totalPages: pagination.totalPages,
                  totalItems: pagination.totalItems,
                  itemsPerPage: pagination.totalItemsPerPage,
                  onPageChange: handlePageChange,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}