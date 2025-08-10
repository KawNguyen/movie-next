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

async function fetchMoviesData(page: number = 1): Promise<ApiResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/phim-moi-cap-nhat?page=${page}`, {
      cache: "no-store",
      headers: {
        "User-Agent": "NextJS Server",
      },
    });

    if (!res.ok) {
      return null;
    }

    const data: ApiResponse = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching movies data:", error);
    return null;
  }
}

const Page = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;

  const moviesData = await fetchMoviesData(page);

  return <ContainerHomePage initialData={moviesData} />;
};

export async function generateMetadata({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;

  const moviesData = await fetchMoviesData(page);

  const title =
    page === 1
      ? "Phim Mới Cập Nhật - Xem Phim Online Miễn Phí"
      : `Phim Mới Cập Nhật - Trang ${page} - Xem Phim Online`;

  const description =
    page === 1
      ? "Xem phim mới cập nhật hàng ngày với chất lượng HD, vietsub và thuyết minh đầy đủ. Tổng hợp phim hay mới nhất 2024."
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
      "phim hay 2024",
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
