import { FavoritesList } from "@/components/favorites/favorites-list";

export default function FavoritesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Phim Yêu Thích</h1>
        <p className="text-muted-foreground">
          Danh sách những bộ phim bạn đã đánh dấu yêu thích
        </p>
      </div>

      <FavoritesList />
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: "Phim Yêu Thích",
    description: "Danh sách phim yêu thích của bạn",
  };
}
