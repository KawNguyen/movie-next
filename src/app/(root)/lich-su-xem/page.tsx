import { WatchHistoryList } from "@/components/watch-history/watch-history-list";
import { getWatchHistoryMovies, getWatchHistoryStats } from "@/data";
import { Suspense } from "react";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

async function WatchHistoryContent() {
  const [historyResult, statsResult] = await Promise.all([
    getWatchHistoryMovies(),
    getWatchHistoryStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      {statsResult.success && statsResult.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-lg p-4 border">
            <div className="text-2xl font-bold text-primary">
              {statsResult.data.total}
            </div>
            <div className="text-sm text-muted-foreground">Tổng lượt xem</div>
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(statsResult.data.totalWatchTime / 3600)}h
            </div>
            <div className="text-sm text-muted-foreground">
              Tổng thời gian xem
            </div>
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <div className="text-2xl font-bold text-blue-600">
              {statsResult.data.uniqueMovies}
            </div>
            <div className="text-sm text-muted-foreground">Phim đã xem</div>
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <div className="text-2xl font-bold text-purple-600">
              {statsResult.data.completedMovies}
            </div>
            <div className="text-sm text-muted-foreground">
              Phim đã hoàn thành
            </div>
          </div>
        </div>
      )}

      {/* Watch History List */}
      <WatchHistoryList
        initialData={historyResult.success ? historyResult.data : undefined}
        error={historyResult.success ? undefined : historyResult.error}
      />
    </div>
  );
}

function WatchHistoryLoading() {
  return (
    <div className="space-y-6">
      {/* Stats Loading */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-4 border animate-pulse">
            <div className="h-8 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        ))}
      </div>

      {/* List Loading */}
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-4 p-4 bg-card rounded-lg border">
              <div className="w-24 h-36 bg-muted rounded-lg flex-shrink-0"></div>
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                  <div className="h-7 bg-muted rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const Page = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lịch Sử Xem Phim</h1>
        <p className="text-muted-foreground">
          Theo dõi tiến trình xem phim và tiếp tục từ nơi bạn đã dừng lại
        </p>
      </div>

      <Suspense fallback={<WatchHistoryLoading />}>
        <WatchHistoryContent />
      </Suspense>
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
