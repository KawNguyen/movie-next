import type { Metadata } from "next";
import ShowContainer from "@/components/show-container";
import { buildQuery, fetchListData } from "@/lib/fetch-list-data";

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

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/quoc-gia/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;

  const countryName = countryMap[slug] || "Quốc Gia";
  const lower = countryName.toLowerCase();

  const data = await fetchListData("quoc-gia", slug, buildQuery(sp));
  const totalItems = data?.data?.params?.pagination?.totalItems || 0;

  return {
    title: `Phim ${countryName} - Xem Phim ${countryName} Online`,
    description: `Xem phim ${countryName} chất lượng cao, vietsub đầy đủ. Tổng hợp ${
      totalItems > 0 ? `${totalItems} bộ ` : ""
    }phim hay nhất từ ${countryName} cập nhật liên tục.`,
    keywords: [
      `phim ${lower}`,
      `xem phim ${lower}`,
      `phim ${lower} vietsub`,
      `phim ${lower} thuyết minh`,
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
      canonical: `/quoc-gia/${slug}`,
    },
  };
}

export default async function Page({
  params,
  searchParams,
}: PageProps<"/quoc-gia/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;

  const data = await fetchListData("quoc-gia", slug, buildQuery(sp));

  return (
    <ShowContainer
      slug={slug}
      searchParams={sp}
      initialData={data}
      apiEndpoint="quoc-gia"
    />
  );
}
