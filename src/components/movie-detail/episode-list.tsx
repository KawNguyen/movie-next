"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Episode, Movie, Server } from "@/types/movie-detail.types";
import { Headphones, Subtitles, Play } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface EpisodeListProps {
  movie: Movie;
  episodes: Server[];
  selectedEpisode: Episode | null;
  selectedServer: number;
  onEpisodeSelect: (episode: Episode, serverIndex: number) => void;
}

export function EpisodeList({
  movie,
  episodes,
  selectedEpisode,
  selectedServer,
  onEpisodeSelect,
}: EpisodeListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTap = searchParams.get("tap");

  const getServerDisplayName = (serverName: string) => {
    if (serverName.toLowerCase().includes("vietsub")) {
      return { name: "Vietsub", icon: Subtitles, variant: "default" as const };
    }
    if (
      serverName.toLowerCase().includes("lồng tiếng") ||
      serverName.toLowerCase().includes("thuyết minh")
    ) {
      return {
        name: "Lồng Tiếng",
        icon: Headphones,
        variant: "secondary" as const,
      };
    }
    return { name: serverName, icon: Play, variant: "outline" as const };
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">Danh sách tập phim</CardTitle>
        <CardDescription className="flex items-center gap-2 text-sm">
          <span>{movie.episode_total} tập</span>
          <span>•</span>
          <Badge
            variant={movie.status === "completed" ? "default" : "secondary"}
            className="text-xs"
          >
            {movie.status === "completed" ? "Hoàn thành" : "Đang cập nhật"}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="0" className="w-full">
          <TabsList className="flex w-full grid-cols-2 mb-2">
            {episodes.map((server, index) => {
              const { name, icon: Icon } = getServerDisplayName(
                server.server_name
              );
              return (
                <TabsTrigger
                  key={index}
                  value={index.toString()}
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="w-4 h-4" />
                  {name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {episodes.map((server, serverIndex) => (
            <TabsContent key={serverIndex} value={serverIndex.toString()}>
              <ScrollArea className="h-[350px] w-full rounded-md border p-2">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {server.server_data.map((episode, episodeIndex) => {
                    const tapNumber = episodeIndex + 1;
                    const isSelected = currentTap
                      ? parseInt(currentTap) === tapNumber
                      : selectedEpisode?.slug === episode.slug &&
                        selectedServer === serverIndex;

                    return (
                      <Button
                        key={episodeIndex}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={`
                          h-10 p-2 text-xs font-medium transition-all duration-200
                          ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "hover:bg-muted hover:scale-105"
                          }
                        `}
                        onClick={() => {
                          const params = new URLSearchParams(
                            searchParams.toString()
                          );
                          params.set("tap", tapNumber.toString());
                          router.push(`?${params.toString()}`);
                          onEpisodeSelect(episode, serverIndex);
                        }}
                      >
                        <span className="truncate">{episode.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
