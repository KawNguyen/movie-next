import { FavoritesList } from "@/components/favorites/favorites-list";
import { getFavoriteMovies, getFavoriteStats } from "@/data";
import { Suspense } from "react";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

async function FavoritesContent() {
  const [favoritesResult, statsResult] = await Promise.all([
    getFavoriteMovies(),
    getFavoriteStats(),
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
            <div className="text-sm text-muted-foreground">
              Tổng số phim yêu thích
            </div>
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <div className="text-2xl font-bold text-green-600">
              {statsResult.data.recentlyAdded}
            </div>
            <div className="text-sm text-muted-foreground">
              Thêm trong 7 ngày qua
            </div>
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <div className="text-2xl font-bold text-blue-600">
              {statsResult.data.movieTypes.find((t) => t.type === "series")
                ?.count || 0}
            </div>
            <div className="text-sm text-muted-foreground">Phim bộ</div>
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <div className="text-2xl font-bold text-purple-600">
              {statsResult.data.movieTypes.find((t) => t.type === "single")
                ?.count || 0}
            </div>
            <div className="text-sm text-muted-foreground">Phim lẻ</div>
          </div>
        </div>
      )}

      {/* Favorites List */}
      <FavoritesList
        initialData={favoritesResult.success ? favoritesResult.data : undefined}
        error={favoritesResult.success ? undefined : favoritesResult.error}
      />
    </div>
  );
}

function FavoritesLoading() {
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

export default function FavoritesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Phim Yêu Thích</h1>
        <p className="text-muted-foreground">
          Danh sách những bộ phim bạn đã đánh dấu yêu thích
        </p>
      </div>

      <Suspense fallback={<FavoritesLoading />}>
        <FavoritesContent />
      </Suspense>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: "Phim Yêu Thích",
    description: "Danh sách phim yêu thích của bạn",
  };
}
