import { WatchHistoryList } from "@/components/watch-history/watch-history-list";

export default function WatchHistoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Lịch sử xem phim</h1>
        <p className="text-muted-foreground">
          Tiếp tục xem phim từ vị trí bạn đã dừng lại.
        </p>
      </div>
      <WatchHistoryList />
    </div>
  );
}

export function generateMetadata() {
  return {
    title: "Lịch sử xem phim",
    description: "Danh sách phim đang xem được lưu trên thiết bị này.",
  };
}
