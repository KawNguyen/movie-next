"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, Clock, Eye, Globe } from "lucide-react";
import { Movie } from "@/types/movie-detail.types";
import { FavoriteButtonSimple } from "@/components/favorites/favorite-button-simple";
import { getImageUrl } from "@/lib/image";

interface MovieHeroProps {
  movie: Movie;
}

export function MovieHero({ movie }: MovieHeroProps) {
  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
          <div className="flex justify-center md:justify-start">
            <Card className="w-[200px] md:w-[300px] overflow-hidden p-0">
              <Image
                src={getImageUrl(movie.poster_url) || "/placeholder.svg"}
                alt={movie.name}
                width={300}
                height={450}
                className="w-full h-auto object-cover"
                priority
              />
            </Card>
          </div>

          <div className="text-center md:text-left">
            <div>
              <h1 className="text-xl md:text-4xl font-bold mb-2">
                {movie.name}
              </h1>
              <p className="text-md md:text-xl  mb-2">{movie.origin_name}</p>
            </div>

            <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
              <FavoriteButtonSimple
                movieId={movie.tmdb.id?.toString() || movie.slug}
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

            <div className="flex max-w-md flex-wrap gap-2 justify-center md:justify-start mb-2">
              {movie.category.map((cat, index) => (
                <Badge key={cat.slug + index} variant="secondary">
                  {cat.name}
                </Badge>
              ))}
              <Badge variant="secondary">{movie.quality}</Badge>
              <Badge variant="secondary">{movie.lang}</Badge>
            </div>

            <div className="flex flex-wrap gap-2 text-sm justify-center md:justify-start">
              <Badge variant="default" className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>{movie.tmdb.vote_average}/10</span>
              </Badge>
              <Badge variant="default" className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{movie.year}</span>
              </Badge>
              <Badge variant="default" className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{movie.time}</span>
              </Badge>
              <Badge variant="default" className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{movie.episode_current}</span>
              </Badge>
              <Badge variant="default" className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                <span>{movie.country[0].name}</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
