import { WatchHistoryList } from "@/components/watch-history/watch-history-list";

const Page = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <WatchHistoryList />
    </div>
  );
};

export default Page;

export async function generateMetadata() {
  return {
    title: "Lịch sử xem phim - Xem Phim Online Vietsub",
    description: "Xem lại lịch sử các bộ phim đã xem trên hệ thống.",
  };
}
