"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, Clock, Eye, Globe } from "lucide-react";
import { Movie } from "@/types/movie-detail.types";

interface MovieHeroProps {
  movie: Movie;
}

export function MovieHero({ movie }: MovieHeroProps) {
  return (
    <div className="relative w-full h-[60vh] overflow-hidden">
      <Image
        src={movie.thumb_url || "/placeholder.svg"}
        alt={movie.name}
        fill
        className="object-cover rounded-lg"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
            <div className="flex justify-center md:justify-start">
              <Card className="w-[200px] md:w-[300px] overflow-hidden p-0">
                <Image
                  src={movie.poster_url || "/placeholder.svg"}
                  alt={movie.name}
                  width={300}
                  height={450}
                  className="w-full h-auto object-cover"
                  priority
                />
              </Card>
            </div>

            <div className="space-y-4 text-center md:text-left">
              <div>
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
                  {movie.name}
                </h1>
                <p className="text-lg md:text-xl text-gray-300 mb-4">
                  {movie.origin_name}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {movie.category.map((cat, index) => (
                  <Badge key={cat.slug + index} variant="secondary">
                    {cat.name}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-white border-white">
                  {movie.quality}
                </Badge>
                <Badge variant="outline" className="text-white border-white">
                  {movie.lang}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-300 justify-center md:justify-start">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>{movie.tmdb.vote_average}/10</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{movie.year}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{movie.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{movie.episode_current}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  <span>{movie.country[0].name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
