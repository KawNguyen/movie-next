"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Movie } from "@/types/movie-detail.types";
import { Star } from "lucide-react";

interface MovieStatsProps {
  movie: Movie;
}

export function MovieStats({ movie }: MovieStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin chi tiết</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Năm sản xuất:</span>
          <span>{movie.year}</span>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span className="text-muted-foreground">Quốc gia:</span>
          <span>{movie.country[0].name}</span>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span className="text-muted-foreground">Thời lượng:</span>
          <span>{movie.time}</span>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span className="text-muted-foreground">Chất lượng:</span>
          <span>{movie.quality}</span>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ngôn ngữ:</span>
          <span>{movie.lang}</span>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span className="text-muted-foreground">Đánh giá:</span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>{movie.tmdb.vote_average}/10</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
