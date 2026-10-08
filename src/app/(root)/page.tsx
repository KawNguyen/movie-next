import { cache } from "react";

import ContainerHomePage from "@/components/home-page/container-home-page";
import { MovieItem } from "@/types/movie-list.types";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface ApiResponse {
  status: boolean;
  msg: string;
  items: MovieItem[];
  pagination: {
    totalItems: number;
    totalItemsPerPage: number;
    currentPage: number;
    totalPages: number;
    updateToday: number;
  };
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// Phim mới cập nhật đổi thường xuyên => cache ngắn (60s)
const MOVIES_REVALIDATE = 60;

function getPage(params: { [key: string]: string | string[] | undefined }) {
  const raw = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

// - Data Cache: dùng lại kết quả trong 60s, không gọi lại API
// - React.cache: gộp Page + generateMetadata thành 1 lần gọi trong cùng request
// - tags: cho phép xoá cache chủ động bằng revalidateTag("movies")
const fetchMoviesData = cache(
  async (page: number): Promise<ApiResponse | null> => {
    try {
      const res = await fetch(`${baseUrl}/api/phim-moi-cap-nhat?page=${page}`, {
        next: { revalidate: MOVIES_REVALIDATE, tags: ["movies"] },
      });

      if (!res.ok) return null;

      return (await res.json()) as ApiResponse;
    } catch (error) {
      console.error("Error fetching movies data:", error);
      return null;
    }
  },
);

const Page = async ({ searchParams }: PageProps) => {
  const page = getPage(await searchParams);
  const moviesData = await fetchMoviesData(page);

  return <ContainerHomePage initialData={moviesData} />;
};

export async function generateMetadata({ searchParams }: PageProps) {
  const page = getPage(await searchParams);
  const moviesData = await fetchMoviesData(page);
  const year = new Date().getFullYear();

  const title =
    page === 1
      ? "Phim Mới Cập Nhật - Xem Phim Online Miễn Phí"
      : `Phim Mới Cập Nhật - Trang ${page} - Xem Phim Online`;

  const description =
    page === 1
      ? `Xem phim mới cập nhật hàng ngày với chất lượng HD, vietsub và thuyết minh đầy đủ. Tổng hợp phim hay mới nhất ${year}.`
      : `Trang ${page} - Danh sách phim mới cập nhật với chất lượng cao, vietsub đầy đủ.`;

  const totalMovies = moviesData?.pagination?.totalItems || 0;
  const updateToday = moviesData?.pagination?.updateToday || 0;

  return {
    title,
    description,
    keywords: [
      "phim mới",
      "phim mới cập nhật",
      "xem phim online",
      "phim vietsub",
      "phim thuyết minh",
      `phim hay ${year}`,
      "phim HD",
      "xem phim miễn phí",
    ].join(", "),
    openGraph: {
      title,
      description,
      type: "website",
      locale: "vi_VN",
      siteName: "Xem Phim Online",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: page === 1 ? "/" : `/?page=${page}`,
    },
    other: {
      "movies:total": totalMovies.toString(),
      "movies:updated_today": updateToday.toString(),
      "page:current": page.toString(),
    },
  };
}

export default Page;