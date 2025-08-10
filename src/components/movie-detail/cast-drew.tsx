"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Movie } from "@/types/movie-detail.types"

interface CastCrewProps {
  movie: Movie
}

export function CastCrew({ movie }: CastCrewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Diễn viên</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {movie.actor.map((actor, index) => (
              <Badge key={index} variant="outline">
                {actor}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Đạo diễn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {movie.director.map((director, index) => (
              <Badge key={index} variant="outline">
                {director}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
