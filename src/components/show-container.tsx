"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MovieItem,
  MovieListParams,
  CategoryApiResponse,
} from "@/types/movie-list.types";
import MovieList from "./movie-list";
import MovieFilter from "./movie-filter";

interface MovieCategoryPageProps {
  slug: string;
  searchParams: { [key: string]: string | string[] | undefined };
  apiEndpoint?: string;
  initialData?: CategoryApiResponse | null;
}

const ShowContainer = ({
  slug,
  searchParams,
  apiEndpoint = "danh-muc",
  initialData = null,
}: MovieCategoryPageProps) => {
  const [movies, setMovies] = useState<MovieItem[]>(
    initialData?.data?.items || []
  );
  const [paginationData, setPaginationData] = useState<{
    totalItems: number;
    totalItemsPerPage: number;
    currentPage: number;
    totalPages: number;
  } | null>(initialData?.data?.params?.pagination || null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const getPageType = (): "category" | "country" | "genre" | "default" => {
    switch (apiEndpoint) {
      case "the-loai":
        return "genre";
      case "quoc-gia":
        return "country";
      case "danh-muc":
        return "category";
      default:
        return "default";
    }
  };

  const parseSearchParams = useCallback((): MovieListParams => {
    return {
      page: searchParams.page ? parseInt(searchParams.page as string) : 1,
      sort_field: searchParams.sort_field as
        | "time"
        | "name"
        | "year"
        | "view"
        | undefined,
      sort_type: searchParams.sort_type as "desc" | "asc" | undefined,
      sort_lang: searchParams.sort_lang as
        | "cn"
        | "en"
        | "kr"
        | "th"
        | undefined,
      category: searchParams.category as string,
      country: searchParams.country as string,
      year: searchParams.year
        ? parseInt(searchParams.year as string)
        : undefined,
      limit: searchParams.limit
        ? parseInt(searchParams.limit as string)
        : undefined,
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<MovieListParams>(parseSearchParams());

  const fetchMovies = useCallback(
    async (params: MovieListParams) => {
      try {
        setLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, value.toString());
          }
        });

        const response = await fetch(
          `/api/${apiEndpoint}/${slug}?${queryParams.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch movies");
        }

        const data: CategoryApiResponse = await response.json();

        if (
          (data.status === "success" && data.data) ||
          (data.status === true && data.data)
        ) {
          setMovies(data.data.items);
          setPaginationData(data.data.params.pagination);
        } else {
          throw new Error(data.msg || "API returned error status");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching movies:", err);
      } finally {
        setLoading(false);
      }
    },
    [slug, apiEndpoint]
  );

  const handleFilterChange = async (newFilters: MovieListParams) => {
    setFilters(newFilters);
    await fetchMovies(newFilters);

    // Cập nhật URL sau khi fetch thành công
    const queryParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== 1
      ) {
        queryParams.append(key, value.toString());
      }
    });

    const baseUrl =
      apiEndpoint === "danh-muc"
        ? "danh-muc"
        : apiEndpoint === "the-loai"
        ? "the-loai"
        : apiEndpoint === "quoc-gia"
        ? "quoc-gia"
        : "danh-muc";

    const newUrl = queryParams.toString()
      ? `/${baseUrl}/${slug}?${queryParams.toString()}`
      : `/${baseUrl}/${slug}`;

    router.push(newUrl, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    handleFilterChange(newFilters);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Lỗi</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MovieFilter
        onFilterChange={handleFilterChange}
        loading={loading}
        initialFilters={filters}
        pageType={getPageType()}
        currentSlug={slug}
      />

      <MovieList
        loading={loading}
        movies={movies}
        pagination={
          paginationData
            ? {
                currentPage: paginationData.currentPage,
                totalPages: paginationData.totalPages,
                totalItems: paginationData.totalItems,
                itemsPerPage: paginationData.totalItemsPerPage,
                onPageChange: handlePageChange,
              }
            : undefined
        }
      />
    </div>
  );
};

export default ShowContainer;
