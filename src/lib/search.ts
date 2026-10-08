import { cache } from "react";
import { SearchApiResponse } from "@/types/movie-list.types";

export const SEARCH_PAGE_LIMIT = 24;

interface GetSearchParams {
  keyword: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch trực tiếp từ API ngoài trên server.
 * - `cache()` của React: generateMetadata + page dùng chung 1 request (dedupe).
 * - `revalidate: 60`: cùng keyword/page trong 60s dùng lại cache => chuyển trang mượt.
 */
export const getSearchMovies = cache(
  async ({
    keyword,
    page = 1,
    limit = SEARCH_PAGE_LIMIT,
  }: GetSearchParams): Promise<SearchApiResponse | null> => {
    const qs = new URLSearchParams({
      keyword,
      page: String(page),
      limit: String(limit),
    });

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/api/tim-kiem?${qs}`,
        { next: { revalidate: 60 } },
      );
      if (!res.ok) return null;
      return (await res.json()) as SearchApiResponse;
    } catch {
      return null;
    }
  },
);