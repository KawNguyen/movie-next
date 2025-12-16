"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Movie } from "@/types/movie-detail.types";
import { UserRound, UsersRound } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

interface CastCrewProps {
  movie: Movie;
}

export function CastCrew({ movie }: CastCrewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="gap-2">
        <CardHeader>
          <CardTitle className="flex items-end gap-1">
            <UsersRound className="size-5" /> Diễn viên
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-14">
            <div className="flex flex-wrap gap-2">
              {movie.actor.map((actor, index) => (
                <Badge key={index} variant="outline">
                  {actor}
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="gap-2">
        <CardHeader>
          <CardTitle className="flex items-end gap-1">
            <UserRound className="size-5" /> Đạo diễn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-14">
            <div className="flex flex-wrap gap-2">
              {movie.director.map((director, index) => (
                <Badge key={index} variant="outline">
                  {director}
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
