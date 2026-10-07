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

const titleMap: Record<string, string> = {
  "phim-le": "Phim Lẻ",
  "phim-bo": "Phim Bộ",
  "phim-hoat-hinh": "Phim Hoạt Hình",
  "tv-shows": "TV Shows",
  "phim-long-tieng": "Phim Lồng Tiếng",
  "phim-thuyet-minh": "Phim Thuyết Minh",
  "phim-vietsub": "Phim Vietsub",
};

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;

  const title = titleMap[slug] || "Danh Mục Phim";
  const lower = title.toLowerCase();

  // Cùng tham số với Page => React.cache gộp thành 1 request
  const data = await fetchListData("danh-muc", slug, buildQuery(sp));
  const totalItems = data?.data?.params?.pagination?.totalItems || 0;

  const fullTitle = `${title} - Xem Phim Online`;

  return {
    title: fullTitle,
    description: `Xem ${lower} chất lượng cao, vietsub đầy đủ. Tổng hợp ${
      totalItems > 0 ? `${totalItems} bộ ` : ""
    }${lower} hay nhất cập nhật liên tục.`,
    keywords: [
      lower,
      `xem ${lower}`,
      `${lower} vietsub`,
      `${lower} thuyết minh`,
      "xem phim online",
      "phim hay",
      "phim mới",
    ].join(", "),
    openGraph: {
      title: fullTitle,
      description: `Xem ${lower} chất lượng cao, vietsub đầy đủ. Tổng hợp các bộ ${lower} hay nhất.`,
      type: "website",
      locale: "vi_VN",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: `Xem ${lower} chất lượng cao, vietsub đầy đủ.`,
    },
    alternates: {
      canonical: `/danh-muc/${slug}`,
    },
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const data = await fetchListData("danh-muc", slug, buildQuery(sp));

  return (
    <ShowContainer
      slug={slug}
      searchParams={sp}
      initialData={data}
      apiEndpoint="danh-muc"
    />
  );
}