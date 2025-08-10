import ShowContainer from "@/components/show-container";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function fetchGenreData(slug: string, page: number = 1) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/the-loai/${slug}?page=${page}`, {
      cache: "no-store",
      headers: {
        "User-Agent": "NextJS Server",
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching genre data:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;

  // Fetch data để generate metadata với SEO từ API
  const genreData = await fetchGenreData(resolvedParams.slug);

  // Fallback genre mapping nếu không có data từ API
  const genreMap: Record<string, string> = {
    "hanh-dong": "Hành Động",
    "co-trang": "Cổ Trang",
    "chien-tranh": "Chiến Tranh",
    "vien-tuong": "Viễn Tưởng",
    "kinh-di": "Kinh Dị",
    "tai-lieu": "Tài Liệu",
    "bi-an": "Bí Ẩn",
    "phim-18": "Phim 18+",
    "tinh-cam": "Tình Cảm",
    "tam-ly": "Tâm Lý",
    "the-thao": "Thể Thao",
    "phieu-luu": "Phiêu Lưu",
    "am-nhac": "Âm Nhạc",
    "gia-dinh": "Gia Đình",
    "hoc-duong": "Học Đường",
    "hai-huoc": "Hài Hước",
    "hinh-su": "Hình Sự",
    "vo-thuat": "Võ Thuật",
    "khoa-hoc": "Khoa Học",
    "than-thoai": "Thần Thoại",
    "chinh-kich": "Chính Kịch",
    "kinh-dien": "Kinh Điển",
  };

  // Ưu tiên sử dụng SEO data từ API, fallback về static mapping
  const title =
    genreData?.data?.seoOnPage?.titleHead ||
    `Phim ${genreMap[resolvedParams.slug] || "Thể Loại"} - Xem Phim ${
      genreMap[resolvedParams.slug] || "Thể Loại"
    } Online`;

  const description =
    genreData?.data?.seoOnPage?.descriptionHead ||
    `Xem phim ${
      genreMap[resolvedParams.slug] || "thể loại"
    } hay nhất, chất lượng cao với vietsub và thuyết minh đầy đủ. Tổng hợp các bộ phim ${(
      genreMap[resolvedParams.slug] || "thể loại"
    ).toLowerCase()} mới nhất.`;

  const genreName = genreMap[resolvedParams.slug] || "Thể Loại";

  return {
    title,
    description,
    keywords: [
      `phim ${genreName.toLowerCase()}`,
      `xem phim ${genreName.toLowerCase()}`,
      `phim ${genreName.toLowerCase()} hay`,
      `phim ${genreName.toLowerCase()} mới`,
      "xem phim online",
      "phim vietsub",
    ].join(", "),
    openGraph: {
      title,
      description,
      type: "website",
      locale: "vi_VN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `/the-loai/${resolvedParams.slug}`,
    },
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // Get page number from searchParams
  const page =
    typeof resolvedSearchParams.page === "string"
      ? parseInt(resolvedSearchParams.page, 10)
      : 1;

  // Fetch data trên server
  const genreData = await fetchGenreData(resolvedParams.slug, page);

  return (
    <ShowContainer
      slug={resolvedParams.slug}
      searchParams={resolvedSearchParams}
      initialData={genreData}
      apiEndpoint="the-loai"
    />
  );
}
