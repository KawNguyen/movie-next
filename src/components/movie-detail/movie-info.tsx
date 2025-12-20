"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Movie } from "@/types/movie-detail.types";
import { ScrollArea } from "../ui/scroll-area";
import { BookText } from "lucide-react";

interface MovieInfoProps {
  movie: Movie;
}

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&quot;": '"',
    "&apos;": "'",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
  };

  return text.replace(
    /&quot;|&apos;|&amp;|&lt;|&gt;/g,
    (match) => entities[match] || match
  );
}

export function MovieInfo({ movie }: MovieInfoProps) {
  return (
    <Card className="gap-1">
      <CardHeader>
        <CardTitle className="flex items-end gap-1">
          <BookText className="size-5" /> Nội dung phim
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="lg:h-40 pr-2">
          <p className="text-muted-foreground leading-relaxed">
            {decodeHtmlEntities(movie.content)}
          </p>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
