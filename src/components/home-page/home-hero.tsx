"use client";

import Image from "next/image";
import { useState } from "react";
import { MovieItem } from "@/types/movie-list.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Info } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Skeleton } from "../ui/skeleton";
import { useRouter } from "next/navigation";

interface HomeHeroProps {
  movies: MovieItem[];
}

export default function HomeHeroCarousel({ movies }: HomeHeroProps) {
  const router = useRouter();
  const heroMovies = movies.slice(0, 5);
  const [imageErrorIndex, setImageErrorIndex] = useState<number | null>(null);

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "/placeholder-movie.jpg";
    if (imagePath.startsWith("http")) return imagePath;
    return `https://phimimg.com/${imagePath}`;
  };

  if (heroMovies.length === 0) {
    return (
      <div className="w-full h-[70vh] flex items-center justify-center rounded-lg overflow-hidden">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[70vh]">
      <Carousel
        plugins={[
          Autoplay({
            delay: 7000,
          }),
        ]}
        opts={{ loop: true }}
        className="h-full rounded-lg overflow-hidden"
      >
        <CarouselContent>
          {heroMovies.map((movie, index) => (
            <CarouselItem key={movie._id || index} className="h-full">
              <div className="relative w-full h-[70vh]">
                {imageErrorIndex === index ? (
                  <div className="w-full h-full bg-background dark:bg-gray-900 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <div className="text-8xl mb-4">🎬</div>
                      <p className="text-lg">No Image</p>
                    </div>
                  </div>
                ) : (
                  <Image
                    src={getImageUrl(movie.poster_url || movie.thumb_url || "")}
                    alt={movie.name}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-cover"
                    onError={() => setImageErrorIndex(index)}
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />

                <div className="absolute inset-0 z-10 flex items-center">
                  <div className="container mx-auto px-4 lg:px-8">
                    <div className="max-w-2xl">
                      <h1 className="text-4xl md:text-6xl line-clamp-1 overflow-hidden text-ellipsis font-bold text-white mb-4 drop-shadow-lg">
                        {movie.name}
                      </h1>
                      {movie.origin_name &&
                        movie.origin_name !== movie.name && (
                          <h2 className="text-xl md:text-2xl text-gray-200 mb-6 drop-shadow-md">
                            {movie.origin_name}
                          </h2>
                        )}

                      <div className="flex flex-wrap gap-3 mb-8">
                        {movie.year && (
                          <Badge
                            variant="outline"
                            className="border-white/30 text-white bg-black/20 px-3 py-1"
                          >
                            {movie.year}
                          </Badge>
                        )}
                        {movie.quality && (
                          <Badge
                            variant="outline"
                            className="border-white/30 text-white bg-black/20 px-3 py-1"
                          >
                            {movie.quality}
                          </Badge>
                        )}
                        {movie.lang && (
                          <Badge
                            variant="outline"
                            className="border-gray-400 text-gray-200 px-3 py-1"
                          >
                            {movie.lang}
                          </Badge>
                        )}
                        {movie.episode_current && (
                          <Badge
                            variant="outline"
                            className="border-gray-400 text-gray-200 px-3 py-1"
                          >
                            {movie.episode_current}
                          </Badge>
                        )}
                      </div>

                      {movie.category?.length > 0 && (
                        <div className="mb-8 flex flex-wrap gap-2">
                          {movie.category.slice(0, 4).map((cat, i) => (
                            <span
                              key={i}
                              className="text-gray-300 text-sm border border-gray-500 px-2 py-1 rounded "
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-4">
                        <Button
                          size="lg"
                          className="bg-white text-black hover:bg-gray-200 font-semibold px-8"
                          onClick={() => router.push(`/phim/${movie.slug}`)}
                        >
                          <Play className="w-5 h-5 mr-2" />
                          Xem Ngay
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          className="border-gray-400   font-semibold px-8"
                        >
                          <Info className="w-5 h-5 mr-2" />
                          Thông Tin
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-20 border border-gray-400" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-20 border border-gray-400" />
      </Carousel>
    </div>
  );
}
