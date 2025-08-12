import ShowContainer from "@/components/show-container";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function fetchCategoryData(slug: string, page: number = 1) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/danh-muc/${slug}?page=${page}`, {
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
    console.error("Error fetching category data:", error);
    return null;
  }
}

export default async function Page({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const page =
    typeof resolvedSearchParams.page === "string"
      ? parseInt(resolvedSearchParams.page, 10)
      : 1;

  const categoryData = await fetchCategoryData(resolvedParams.slug, page);

  return (
    <ShowContainer
      slug={resolvedParams.slug}
      searchParams={resolvedSearchParams}
      initialData={categoryData}
      apiEndpoint="danh-muc"
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;

  const titleMap: Record<string, string> = {
    "phim-le": "Phim Lẻ",
    "phim-bo": "Phim Bộ",
    "phim-hoat-hinh": "Phim Hoạt Hình",
    "tv-shows": "TV Shows",
    "phim-long-tieng": "Phim Lồng Tiếng",
    "phim-thuyet-minh": "Phim Thuyết Minh",
    "phim-vietsub": "Phim Vietsub",
  };

  const title = titleMap[resolvedParams.slug] || "Danh Mục Phim";

  const categoryData = await fetchCategoryData(resolvedParams.slug);
  const totalItems = categoryData?.pagination?.totalItems || 0;

  return {
    title: `${title} - Xem Phim Online`,
    description: `Xem ${title.toLowerCase()} chất lượng cao, vietsub đầy đủ. Tổng hợp ${
      totalItems > 0 ? `${totalItems} bộ ` : ""
    }${title.toLowerCase()} hay nhất cập nhật liên tục.`,
    keywords: [
      title.toLowerCase(),
      `xem ${title.toLowerCase()}`,
      `${title.toLowerCase()} vietsub`,
      `${title.toLowerCase()} thuyết minh`,
      "xem phim online",
      "phim hay",
      "phim mới",
    ].join(", "),
    openGraph: {
      title: `${title} - Xem Phim Online`,
      description: `Xem ${title.toLowerCase()} chất lượng cao, vietsub đầy đủ. Tổng hợp các bộ ${title.toLowerCase()} hay nhất.`,
      type: "website",
      locale: "vi_VN",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - Xem Phim Online`,
      description: `Xem ${title.toLowerCase()} chất lượng cao, vietsub đầy đủ.`,
    },
    alternates: {
      canonical: `/danh-muc/${resolvedParams.slug}`,
    },
  };
}
