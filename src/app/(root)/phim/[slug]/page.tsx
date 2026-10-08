import { cache } from "react";

import MovieDetail from "@/components/movie-detail/movie-detail";
import { MovieDetailResponse } from "@/types/movie-detail.types";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// Thông tin phim ít đổi => cache lâu hơn (5 phút).
// Trang này không đọc searchParams nên Next có thể cache cả trang (ISR).
export const revalidate = 300;

// Trả về mảng rỗng: không build sẵn trang nào, nhưng mỗi slug được
// render một lần ở request đầu tiên rồi cache lại (on-demand ISR).
export function generateStaticParams() {
  return [];
}

// - Data Cache: dùng lại kết quả trong 5 phút
// - React.cache: gộp Page + generateMetadata thành 1 lần gọi
// - tags: revalidateTag(`movie:${slug}`) để làm mới một phim cụ thể
const fetchMovieData = cache(
  async (slug: string): Promise<MovieDetailResponse | null> => {
    try {
      const res = await fetch(`${baseUrl}/api/phim/${slug}`, {
        next: { revalidate: 300, tags: ["movies", `movie:${slug}`] },
      });

      if (!res.ok) return null;

      return (await res.json()) as MovieDetailResponse;
    } catch (error) {
      console.error("Error fetching movie data:", error);
      return null;
    }
  },
);

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;

  const movieData = await fetchMovieData(slug);

  return <MovieDetail slug={slug} initialData={movieData} />;
};

export default Page;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const data = await fetchMovieData(slug);

  if (!data || !data.movie) {
    return {
      title: "Phim không tìm thấy",
      description: "Phim bạn tìm kiếm không tồn tại hoặc đã bị xóa.",
    };
  }

  const { movie } = data;
  const movieTitle = movie.name;
  const originalTitle = movie.origin_name;
  const year = movie.year;
  const description =
    movie.content || "Xem phim chất lượng cao, vietsub đầy đủ.";

  const metaDescription =
    description.length > 160
      ? description.substring(0, 157) + "..."
      : description;

  return {
    title: `${movieTitle} (${year}) - Xem Phim Online Vietsub`,
    description: metaDescription,
    keywords: [
      movieTitle,
      originalTitle,
      `phim ${year}`,
      "xem phim online",
      "phim vietsub",
      "phim thuyết minh",
      ...(movie.category?.map((cat) => cat.name) || []),
      ...(movie.country?.map((country) => country.name) || []),
    ]
      .filter(Boolean)
      .join(", "),
    openGraph: {
      title: `${movieTitle} (${year}) - Xem Phim Online`,
      description: metaDescription,
      type: "video.movie",
      locale: "vi_VN",
      images: movie.poster_url
        ? [
            {
              url: movie.poster_url,
              width: 400,
              height: 600,
              alt: movieTitle,
            },
          ]
        : [],
      releaseDate: year.toString(),
    },
    twitter: {
      card: "summary_large_image",
      title: `${movieTitle} (${year})`,
      description: metaDescription,
      images: movie.poster_url ? [movie.poster_url] : [],
    },
    alternates: {
      canonical: `/phim/${slug}`,
    },
    other: {
      "movie:duration": movie.time || undefined,
      "movie:release_date": year.toString(),
      "movie:genre":
        movie.category?.map((cat) => cat.name).join(", ") || undefined,
    },
  };
}