import { FavoritesList } from "@/components/favorites/favorites-list";

export default function FavoritesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
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
