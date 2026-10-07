import type { Metadata } from "next";
import ShowContainer from "@/components/show-container";
import {
  buildQuery,
  fetchListData,
  type SearchParamsInput,
} from "@/lib/fetch-list-data";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParamsInput>;
}

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

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;

  // Cùng tham số với Page => React.cache gộp thành 1 request
  const data = await fetchListData("the-loai", slug, buildQuery(sp));

  const genreName = genreMap[slug] || "Thể Loại";
  const lower = genreName.toLowerCase();

  // Ưu tiên SEO từ API, fallback về mapping tĩnh
  const title =
    data?.data?.seoOnPage?.titleHead ||
    `Phim ${genreName} - Xem Phim ${genreName} Online`;

  const description =
    data?.data?.seoOnPage?.descriptionHead ||
    `Xem phim ${lower} hay nhất, chất lượng cao với vietsub và thuyết minh đầy đủ. Tổng hợp các bộ phim ${lower} mới nhất.`;

  return {
    title,
    description,
    keywords: [
      `phim ${lower}`,
      `xem phim ${lower}`,
      `phim ${lower} hay`,
      `phim ${lower} mới`,
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
      canonical: `/the-loai/${slug}`,
    },
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const data = await fetchListData("the-loai", slug, buildQuery(sp));

  return (
    <ShowContainer
      slug={slug}
      searchParams={sp}
      initialData={data}
      apiEndpoint="the-loai"
    />
  );
}
