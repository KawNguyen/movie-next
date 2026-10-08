"use client";

import { useEffect, useState } from "react";
import type { MovieItem, SearchApiResponse } from "@/types/movie-list.types";

/** Số kết quả hiển thị trong dropdown / sheet trước khi chuyển sang trang /tim-kiem */
export const SEARCH_PREVIEW_LIMIT = 12;

interface SearchState {
  items: MovieItem[];
  total: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

const IDLE: SearchState = {
  items: [],
  total: 0,
  totalPages: 0,
  loading: false,
  error: null,
};

// Cache nhỏ trong bộ nhớ: mở lại dropdown / quay lại trang không phải gọi API lần nữa
type Cached = Pick<SearchState, "items" | "total" | "totalPages">;
const cache = new Map<string, Cached>();
const CACHE_MAX = 40;

function remember(key: string, value: Cached) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, value);
}

/**
 * Một hook duy nhất cho cả dropdown, sheet mobile và trang /tim-kiem.
 * - Tự huỷ request cũ (AbortController) khi từ khoá đổi -> không còn race condition
 * - Giữ kết quả cũ trong lúc tải kết quả mới -> không bị nháy trắng
 */
export function useMovieSearch(keyword: string, page = 1, limit?: number) {
  const trimmed = keyword.trim();
  const [state, setState] = useState<SearchState>(IDLE);

  useEffect(() => {
    if (!trimmed) {
      setState(IDLE);
      return;
    }

    const key = `${trimmed.toLowerCase()}|${page}`;
    const cached = cache.get(key);
    if (cached) {
      setState({ ...cached, loading: false, error: null });
      return;
    }

    const ac = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    fetch(
      `/api/tim-kiem?keyword=${encodeURIComponent(trimmed)}&page=${page}`,
      { signal: ac.signal },
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<SearchApiResponse>;
      })
      .then((data) => {
        const pagination = data.data?.params?.pagination;
        const result: Cached =
          data.status && data.data?.items
            ? {
                items: data.data.items,
                total: pagination?.totalItems ?? data.data.items.length,
                totalPages: pagination?.totalPages ?? 1,
              }
            : { items: [], total: 0, totalPages: 0 };
        remember(key, result);
        setState({ ...result, loading: false, error: null });
      })
      .catch((err) => {
        if (ac.signal.aborted) return;
        console.error("Search error:", err);
        setState({
          ...IDLE,
          error: "Không thể tải kết quả. Vui lòng thử lại.",
        });
      });

    return () => ac.abort();
  }, [trimmed, page]);

  return {
    ...state,
    items: limit ? state.items.slice(0, limit) : state.items,
  };
}

export const searchHref = (keyword: string, page?: number) => {
  const params = new URLSearchParams({ keyword: keyword.trim() });
  if (page && page > 1) params.set("page", String(page));
  return `/tim-kiem?${params.toString()}`;
};