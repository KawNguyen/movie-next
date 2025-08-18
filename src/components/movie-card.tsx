import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, Clock } from "lucide-react";
import { MovieItem } from "@/types/movie-list.types";
import { AspectRatio } from "./ui/aspect-ratio";
import { FavoriteButton } from "./favorites/favorite-button";
import Link from "next/link";

const MovieCard = ({
  slug,
  tmdb,
  name,
  poster_url,
  time,
  year,
  category,
  priority = false,
}: MovieItem & { priority?: boolean }) => {
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "/placeholder-movie.jpg";
    if (imagePath.startsWith("http")) return imagePath;
    return `https://phimimg.com/${imagePath}`;
  };
  return (
    <Card className="group border-1 p-0 overflow-hidden transition-all duration-300 hover:-translate-y-2">
      <Link href={`/phim/${slug}`}>
        <CardHeader className="p-0">
          <AspectRatio
            ratio={2 / 3}
            className="relative overflow-hidden w-full"
          >
            <Image
              src={getImageUrl(poster_url)}
              alt={name}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Badge className="absolute top-3 right-3 bg-black/70 text-white border-0">
              <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
              {tmdb.vote_average}
            </Badge>
            <FavoriteButton
              movieId={tmdb?.id?.toString() || slug}
              movieSlug={slug}
              movieName={name}
              posterUrl={poster_url}
              className="absolute top-3 left-3"
            />
          </AspectRatio>
        </CardHeader>
        <CardContent className="p-2 sm:p-3 text-center sm:text-left">
          <h3 className="font-semibold text-md md:text-lg mb-2 line-clamp-1 overflow-hidden text-ellipsis group-hover:text-primary transition-colors">
            {name}
          </h3>
          <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground mb-2 ">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {year}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {time}
            </div>
          </div>
          <div className="hidden sm:flex flex-wrap gap-2">
            {category.slice(0, 2).map((cat) => (
              <Badge key={cat.id} variant="secondary" className="text-xs">
                {cat.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default MovieCard;
