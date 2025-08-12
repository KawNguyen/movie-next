import { ComingSoon, comingSoonConfigs } from "@/lib/coming-soon";

const Page = () => {
  return <ComingSoon {...comingSoonConfigs.lichSuXem} />;
};

export default Page;

export async function generateMetadata() {
  return {
    title: "Lịch sử xem phim - Xem Phim Online Vietsub",
    description: "Xem lại lịch sử các bộ phim đã xem trên hệ thống.",
  };
}
