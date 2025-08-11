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
  // CarouselPrevious,
  // CarouselNext,
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
      <div className="w-full h-[50vh] sm:h-[70vh] flex items-center justify-center rounded-lg overflow-hidden">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[50vh] sm:h-[70vh]">
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
              <div className="relative w-full h-[50vh] sm:h-[70vh]">
                {imageErrorIndex === index ? (
                  <div className="w-full h-full bg-background dark:bg-gray-900 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <div className="text-6xl sm:text-8xl mb-4">🎬</div>
                      <p className="text-base sm:text-lg">No Image</p>
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
                  <div className="container mx-auto px-3 sm:px-4 lg:px-8">
                    <div className="max-w-2xl">
                      <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-white mb-2 sm:mb-4 drop-shadow-lg line-clamp-2">
                        {movie.name}
                      </h1>
                      {movie.origin_name &&
                        movie.origin_name !== movie.name && (
                          <h2 className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-4 sm:mb-6 drop-shadow-md line-clamp-1">
                            {movie.origin_name}
                          </h2>
                        )}

                      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-8">
                        {movie.year && (
                          <Badge
                            variant="default"
                            className="px-2 sm:px-3 py-0.5 sm:py-1"
                          >
                            {movie.year}
                          </Badge>
                        )}
                        {movie.quality && (
                          <Badge
                            variant="default"
                            className="px-2 sm:px-3 py-0.5 sm:py-1"
                          >
                            {movie.quality}
                          </Badge>
                        )}
                        {movie.lang && (
                          <Badge
                            variant="default"
                            className="px-2 sm:px-3 py-0.5 sm:py-1"
                          >
                            {movie.lang}
                          </Badge>
                        )}
                        {movie.episode_current && (
                          <Badge
                            variant="default"
                            className="px-2 sm:px-3 py-0.5 sm:py-1"
                          >
                            {movie.episode_current}
                          </Badge>
                        )}
                      </div>

                      {movie.category?.length > 0 && (
                        <div className="mb-4 sm:mb-8 flex flex-wrap gap-1 sm:gap-2">
                          {movie.category.slice(0, 3).map((cat, i) => (
                            <Badge
                              variant="secondary"
                              key={cat.slug + i}
                              className="px-2 sm:px-3 py-0.5 sm:py-1"
                            >
                              {cat.name}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 sm:gap-4">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="sm:size-lg font-semibold px-4 sm:px-8"
                          onClick={() => router.push(`/phim/${movie.slug}`)}
                        >
                          <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                          Xem Ngay
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="sm:size-lg border-gray-400 font-semibold px-4 sm:px-8"
                        >
                          <Info className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
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

        {/* <CarouselPrevious className="hidden sm:flex absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 border border-gray-400" />
        <CarouselNext className="hidden sm:flex absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 border border-gray-400" /> */}
      </Carousel>
    </div>
  );
}
