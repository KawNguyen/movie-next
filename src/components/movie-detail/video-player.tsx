"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Loader2 } from "lucide-react";
import { Episode, Server } from "@/types/movie-detail.types";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
  selectedEpisode: Episode;
  selectedServer: Server;
}

export function VideoPlayer({
  selectedEpisode,
  selectedServer,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canPlay, setCanPlay] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (
      !video ||
      !selectedServer.server_data ||
      selectedServer.server_data.length === 0
    )
      return;

    setIsTransitioning(true);

    // Reset states
    setIsLoading(true);
    setError(null);
    setCanPlay(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const currentEpisodeData = selectedServer.server_data.find(
      (ep) => ep.slug === selectedEpisode.slug
    );

    if (!currentEpisodeData || !currentEpisodeData.link_m3u8) {
      setError("Không tìm thấy link video cho tập này.");
      setIsLoading(false);
      return;
    }

    const videoSrc = currentEpisodeData.link_m3u8;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsRef.current = hls;

      hls.loadSource(videoSrc);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        setCanPlay(true);
        setIsTransitioning(false);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS error:", data);
        if (data.fatal) {
          setError("Không thể tải video. Vui lòng thử server khác.");
          setIsLoading(false);
          setIsTransitioning(false);
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = videoSrc;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        setCanPlay(true);
        setIsTransitioning(false);
      });
      video.addEventListener("error", () => {
        setError("Không thể tải video. Vui lòng thử server khác.");
        setIsLoading(false);
        setIsTransitioning(false);
      });
    } else {
      setError("Trình duyệt không hỗ trợ phát video HLS.");
      setIsLoading(false);
      setIsTransitioning(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedServer.server_data, selectedEpisode.slug]);

  const handlePlay = () => {
    const video = videoRef.current;
    if (video && canPlay) {
      video.play().catch((error) => {
        console.error("Error playing video:", error);
        setError("Không thể phát video.");
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Đang xem: {selectedEpisode.name}</span>
          <Badge variant="outline">{selectedServer.server_name}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center text-center text-white bg-black/50">
              <div>
                <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Lỗi phát video</p>
                <p className="text-sm opacity-75">{error}</p>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className={`w-full h-full transition-opacity duration-300 ${
                  isTransitioning ? "opacity-50" : "opacity-100"
                }`}
                controls={canPlay && !isTransitioning}
                preload="metadata"
                crossOrigin="anonymous"
                playsInline
              />

              {(isLoading || isTransitioning) && (
                <div className="absolute inset-0 flex items-center justify-center text-center text-white bg-black/50 transition-opacity duration-200">
                  <div>
                    <Loader2 className="w-16 h-16 mx-auto mb-4 opacity-50 animate-spin" />
                    <p className="text-lg">
                      {isTransitioning
                        ? "Đang chuyển tập..."
                        : "Đang tải video..."}
                    </p>
                  </div>
                </div>
              )}

              {!isLoading && !canPlay && !error && !isTransitioning && (
                <div
                  className="absolute inset-0 flex items-center justify-center text-center text-white bg-black/50 cursor-pointer"
                  onClick={handlePlay}
                >
                  <div>
                    <Play className="w-16 h-16 mx-auto mb-4 opacity-50 hover:opacity-100 transition-opacity" />
                    <p className="text-lg">Nhấn để phát</p>
                    <p className="text-sm opacity-75">
                      {selectedEpisode.filename}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
