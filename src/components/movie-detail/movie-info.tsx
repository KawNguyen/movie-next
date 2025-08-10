"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Movie } from "@/types/movie-detail.types"

interface MovieInfoProps {
  movie: Movie
}

export function MovieInfo({ movie }: MovieInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nội dung phim</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">{movie.content}</p>
      </CardContent>
    </Card>
  )
}
