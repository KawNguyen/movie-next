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
import { Headphones, Subtitles, Play, Loader2, ScrollText } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

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
  const currentServer = searchParams.get("server");
  const [isChanging, setIsChanging] = useState(false);
  const [isServerChanging, setIsServerChanging] = useState(false);

  const getServerSlug = (serverName: string) => {
    if (serverName.toLowerCase().includes("vietsub")) {
      return "vietsub";
    }
    if (
      serverName.toLowerCase().includes("lồng tiếng") ||
      serverName.toLowerCase().includes("thuyết minh")
    ) {
      return "thuyet-minh";
    }
    return "vietsub"; // default
  };

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

  const getCurrentServerIndex = () => {
    if (!currentServer) return selectedServer;

    const serverIndex = episodes.findIndex(
      (server) => getServerSlug(server.server_name) === currentServer
    );
    return serverIndex >= 0 ? serverIndex : selectedServer;
  };

  const activeServerIndex = getCurrentServerIndex();

  const handleServerChange = (serverIndex: number) => {
    setIsServerChanging(true);
    const params = new URLSearchParams(searchParams.toString());
    const serverSlug = getServerSlug(episodes[serverIndex].server_name);
    params.set("server", serverSlug);

    // Reset tập về 1 khi chuyển server
    params.set("tap", "1");

    router.push(`?${params.toString()}`);

    // Chọn tập đầu tiên của server mới
    if (episodes[serverIndex]?.server_data?.[0]) {
      onEpisodeSelect(episodes[serverIndex].server_data[0], serverIndex);
    }

    // Reset loading state sau 500ms
    setTimeout(() => setIsServerChanging(false), 500);
  };

  return (
    <Card className="overflow-hidden h-full w-full gap-4">
      <CardHeader className="gap-3">
        <CardTitle className="flex items-end gap-1">
          <ScrollText className="size-5" />
          Danh sách tập phim
        </CardTitle>
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
      <CardContent className="flex">
        {isServerChanging && (
          <div className="mb-4 p-3 bg-muted rounded-lg flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang chuyển đổi phiên bản...</span>
          </div>
        )}
        <Tabs value={activeServerIndex.toString()} className="w-full">
          <TabsList className="flex w-full grid-cols-2 mb-2">
            {episodes.map((server, index) => {
              const { name, icon: Icon } = getServerDisplayName(
                server.server_name
              );
              return (
                <TabsTrigger
                  key={index}
                  value={index.toString()}
                  className={`flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 ${
                    isServerChanging ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={() => handleServerChange(index)}
                  disabled={isServerChanging}
                >
                  {isServerChanging ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  {name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {episodes.map((server, serverIndex) => (
            <TabsContent key={serverIndex} value={serverIndex.toString()}>
              <ScrollArea className="h-90 w-full rounded-md border p-2">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {server.server_data.map((episode, episodeIndex) => {
                    const tapNumber = episodeIndex + 1;
                    const isSelected = currentTap
                      ? parseInt(currentTap) === tapNumber &&
                        activeServerIndex === serverIndex
                      : selectedEpisode?.slug === episode.slug &&
                        selectedServer === serverIndex;

                    return (
                      <Button
                        key={episodeIndex}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        disabled={isChanging || isSelected}
                        className={`
                          h-10 p-2 text-xs font-medium transition-all duration-200
                          ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "hover:bg-muted"
                          }
                          ${isChanging ? "opacity-50 cursor-not-allowed" : ""}
                        `}
                        onClick={() => {
                          if (isChanging) return;

                          setIsChanging(true);
                          const params = new URLSearchParams(
                            searchParams.toString()
                          );
                          params.set("tap", tapNumber.toString());

                          // Đảm bảo server param được set đúng
                          const serverSlug = getServerSlug(
                            episodes[serverIndex].server_name
                          );
                          params.set("server", serverSlug);

                          router.push(`?${params.toString()}`);
                          onEpisodeSelect(episode, serverIndex);

                          setTimeout(() => setIsChanging(false), 300);
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
