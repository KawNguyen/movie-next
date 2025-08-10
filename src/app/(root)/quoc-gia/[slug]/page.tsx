import ShowContainer from "@/components/show-container";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Server-side fetch function
async function fetchCountryData(slug: string, page: number = 1) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/quoc-gia/${slug}?page=${page}`, {
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
    console.error("Error fetching country data:", error);
    return null;
  }
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
  const countryData = await fetchCountryData(resolvedParams.slug, page);

  return (
    <ShowContainer
      slug={resolvedParams.slug}
      searchParams={resolvedSearchParams}
      initialData={countryData}
      apiEndpoint="quoc-gia"
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;

  // Mapping từ routes.ts
  const countryMap: Record<string, string> = {
    "trung-quoc": "Trung Quốc",
    "thai-lan": "Thái Lan",
    "hong-kong": "Hồng Kông",
    phap: "Pháp",
    duc: "Đức",
    "ha-lan": "Hà Lan",
    mexico: "Mexico",
    "thuy-dien": "Thụy Điển",
    philippines: "Philippines",
    "dan-mach": "Đan Mạch",
    "thuy-si": "Thụy Sĩ",
    ukraina: "Ukraina",
    "han-quoc": "Hàn Quốc",
    "au-my": "Âu Mỹ",
    "an-do": "Ấn Độ",
    canada: "Canada",
    "tay-ban-nha": "Tây Ban Nha",
    indonesia: "Indonesia",
    "ba-lan": "Ba Lan",
    malaysia: "Malaysia",
    "bo-dao-nha": "Bồ Đào Nha",
    uae: "UAE",
    "chau-phi": "Châu Phi",
    "a-rap-xe-ut": "Ả Rập Xê Út",
    "nhat-ban": "Nhật Bản",
    "dai-loan": "Đài Loan",
    anh: "Anh",
    "tho-nhi-ky": "Thổ Nhĩ Kỳ",
    nga: "Nga",
    uc: "Úc",
    brazil: "Brazil",
    y: "Ý",
    "na-uy": "Na Uy",
    "nam-phi": "Nam Phi",
    "viet-nam": "Việt Nam",
    khac: "Quốc Gia Khác",
  };

  const countryName = countryMap[resolvedParams.slug] || "Quốc Gia";

  // Fetch data để có thêm thông tin cho metadata
  const countryData = await fetchCountryData(resolvedParams.slug);
  const totalItems = countryData?.pagination?.totalItems || 0;

  return {
    title: `Phim ${countryName} - Xem Phim ${countryName} Online`,
    description: `Xem phim ${countryName} chất lượng cao, vietsub đầy đủ. Tổng hợp ${
      totalItems > 0 ? `${totalItems} bộ ` : ""
    }phim hay nhất từ ${countryName} cập nhật liên tục.`,
    keywords: [
      `phim ${countryName.toLowerCase()}`,
      `xem phim ${countryName.toLowerCase()}`,
      `phim ${countryName.toLowerCase()} vietsub`,
      `phim ${countryName.toLowerCase()} thuyết minh`,
      "xem phim online",
      "phim hay",
    ].join(", "),
    openGraph: {
      title: `Phim ${countryName} - Xem Phim ${countryName} Online`,
      description: `Xem phim ${countryName} chất lượng cao, vietsub đầy đủ. Tổng hợp các bộ phim hay nhất từ ${countryName}.`,
      type: "website",
      locale: "vi_VN",
    },
    twitter: {
      card: "summary_large_image",
      title: `Phim ${countryName} - Xem Phim Online`,
      description: `Xem phim ${countryName} chất lượng cao, vietsub đầy đủ.`,
    },
    alternates: {
      canonical: `/quoc-gia/${resolvedParams.slug}`,
    },
  };
}
