import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Globe, ListVideo, Star } from "lucide-react";
import { Movie } from "@/types/movie-detail.types";
import { FavoriteButtonSimple } from "@/components/favorites/favorite-button-simple";

interface MovieHeroProps {
  movie: Movie;
}

export function MovieHero({ movie }: MovieHeroProps) {
  const rating = movie.tmdb?.vote_average;
  const country = movie.country?.map((c) => c.name).join(", ");

  // Chỉ hiện những mục có dữ liệu -> không còn badge rỗng hoặc crash khi thiếu field
  const meta = [
    { icon: Calendar, text: movie.year },
    { icon: Clock, text: movie.time },
    { icon: ListVideo, text: movie.episode_current },
    { icon: Globe, text: country },
  ].filter((m) => m.text);

  return (
    <header>
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[300px_minmax(0,1fr)]">
        <div className="flex justify-center md:justify-start">
          <Image
            src={movie.poster_url || "/placeholder.svg"}
            alt={`Poster phim ${movie.name}`}
            width={300}
            height={450}
            sizes="(min-width: 768px) 300px, 200px"
            priority
            className="h-auto w-[200px] rounded-xl object-cover shadow-xl ring-1 ring-border md:w-[300px]"
          />
        </div>

        <div className="space-y-4 text-center md:text-left">
          <div className="space-y-1">
            <h1 className="text-balance text-2xl font-bold tracking-tight md:text-4xl">
              {movie.name}
            </h1>
            {movie.origin_name && (
              <p className="text-base text-muted-foreground md:text-xl">
                {movie.origin_name}
              </p>
            )}
          </div>

          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm md:justify-start">
            {rating ? (
              <li className="flex items-center gap-1.5 font-semibold">
                <Star className="size-4 fill-yellow-500 text-yellow-500" />
                {rating.toFixed(1)}/10
              </li>
            ) : null}
            {meta.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-1.5 text-muted-foreground"
              >
                <Icon className="size-4" />
                {text}
              </li>
            ))}
          </ul>

          <ul className="flex flex-wrap justify-center gap-2 md:justify-start">
            {movie.category?.map((cat) => (
              <li key={cat.slug}>
                <Badge variant="secondary">{cat.name}</Badge>
              </li>
            ))}
            {movie.quality && (
              <li>
                <Badge variant="outline">{movie.quality}</Badge>
              </li>
            )}
            {movie.lang && (
              <li>
                <Badge variant="outline">{movie.lang}</Badge>
              </li>
            )}
          </ul>

          <div className="flex items-center justify-center gap-3 md:justify-start">
            <FavoriteButtonSimple
              movieId={movie.tmdb?.id?.toString() || movie.slug}
              movieSlug={movie.slug}
              movieName={movie.name}
              posterUrl={movie.poster_url}
              movieType={movie.type}
              size="md"
              className="bg-red-500 hover:bg-red-600"
            />
            <span className="text-sm text-muted-foreground">
              Thêm vào danh sách yêu thích
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
