"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Loader2 } from "lucide-react";
import { Episode, Server } from "@/types/movie-detail.types";
import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { toast } from "sonner";
import { useWatchEvents } from "@/hooks/use-watch-events";
import { VideoElementWrapper } from "./video-element-wrapper";
import { handleHlsError, cleanupHls } from "@/lib/hls-config";

interface VideoPlayerProps {
  selectedEpisode: Episode;
  selectedServer: Server;
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl?: string;
}

export function VideoPlayer({
  selectedEpisode,
  selectedServer,
  movieId,
  movieSlug,
  movieName,
  posterUrl,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canPlay, setCanPlay] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Watch events hook
  const {
    handleStartWatch,
    handleProgressUpdate,
    handleCompleteWatch,
    handlePauseWatch,
    handleResumeWatch,
    getSavedProgress,
  } = useWatchEvents({
    movieId,
    movieSlug,
    movieName,
    posterUrl,
    episodeId: selectedEpisode.slug,
    episodeName: selectedEpisode.name,
  });

  // Load saved progress when episode changes
  const loadSavedProgress = useCallback(async () => {
    try {
      const progress = await getSavedProgress();
      return progress;
    } catch (error) {
      console.error("Error loading saved progress:", error);
      return 0;
    }
  }, [getSavedProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (
      !video ||
      !selectedServer.server_data ||
      selectedServer.server_data.length === 0
    )
      return;

    let isComponentMounted = true;
    setIsTransitioning(true);

    // Reset states
    setIsLoading(true);
    setError(null);
    setCanPlay(false);

    // Properly cleanup previous HLS instance
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch (e) {
        console.warn("Error destroying HLS instance:", e);
      }
      hlsRef.current = null;
    }

    // Reset video src to prevent conflicts
    video.removeAttribute("src");
    video.load();

    const currentEpisodeData = selectedServer.server_data.find(
      (ep) => ep.slug === selectedEpisode.slug
    );

    if (!currentEpisodeData || !currentEpisodeData.link_m3u8) {
      setError("Không tìm thấy link video cho tập này.");
      setIsLoading(false);
      return;
    }

    const videoSrc = currentEpisodeData.link_m3u8;

    // Load saved progress first, then setup video
    loadSavedProgress().then((savedProgress) => {
      if (!isComponentMounted) return;

      if (Hls.isSupported()) {
        const hls = new Hls({
          // Buffer configuration - tối ưu để giảm thiểu memory usage
          maxBufferLength: 10, // 10 seconds forward buffer
          maxMaxBufferLength: 20, // Maximum allowed buffer length
          maxBufferSize: 60 * 1000 * 1000, // 60MB buffer size
          maxBufferHole: 0.3, // 300ms hole tolerance

          // Loading và retry configuration
          manifestLoadingMaxRetry: 3,
          manifestLoadingRetryDelay: 500,
          levelLoadingMaxRetry: 3,
          levelLoadingRetryDelay: 500,
          fragLoadingMaxRetry: 3,
          fragLoadingRetryDelay: 500,

          // Startup performance
          startLevel: -1, // Auto start level
          capLevelToPlayerSize: true, // Limit resolution to player size

          // Error recovery
          enableWorker: true, // Use web worker if available

          // Network optimization
          enableSoftwareAES: true,

          // Fragment loading
          fragLoadingTimeOut: 20000, // 20s timeout
          manifestLoadingTimeOut: 10000, // 10s timeout

          // Live stream specific
          liveBackBufferLength: 5,
        });

        hlsRef.current = hls;

        hls.loadSource(videoSrc);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!isComponentMounted) return;
          setIsLoading(false);
          setCanPlay(true);
          setIsTransitioning(false);

          // Restore saved progress
          if (savedProgress > 0) {
            setTimeout(() => {
              if (!isComponentMounted || !video) return;
              video.currentTime = savedProgress;
              toast.success(
                `Tiếp tục từ ${Math.floor(savedProgress / 60)}:${Math.floor(
                  savedProgress % 60
                )
                  .toString()
                  .padStart(2, "0")}`
              );
            }, 500);
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (!isComponentMounted) return;

          console.error("HLS error:", data);

          // Sử dụng error handler tối ưu
          const recovered = handleHlsError(hls, data);

          if (!recovered && data.fatal) {
            setError("Không thể tải video. Vui lòng thử server khác.");
            setIsLoading(false);
            setIsTransitioning(false);
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support (Safari)
        video.src = videoSrc;

        const handleLoadedMetadata = () => {
          if (!isComponentMounted) return;
          setIsLoading(false);
          setCanPlay(true);
          setIsTransitioning(false);

          // Restore saved progress
          if (savedProgress > 0) {
            setTimeout(() => {
              if (!isComponentMounted || !video) return;
              video.currentTime = savedProgress;
              toast.success(
                `Tiếp tục từ ${Math.floor(savedProgress / 60)}:${Math.floor(
                  savedProgress % 60
                )
                  .toString()
                  .padStart(2, "0")}`
              );
            }, 500);
          }
        };

        const handleVideoError = () => {
          if (!isComponentMounted) return;
          setError("Không thể tải video. Vui lòng thử server khác.");
          setIsLoading(false);
          setIsTransitioning(false);
        };

        video.addEventListener("loadedmetadata", handleLoadedMetadata);
        video.addEventListener("error", handleVideoError);
      } else {
        setError("Trình duyệt không hỗ trợ phát video HLS.");
        setIsLoading(false);
        setIsTransitioning(false);
      }
    });

    // Add event listeners for watch tracking
    const handleVideoTimeUpdate = () => {
      if (!video || !video.duration || !isComponentMounted) return;
      handleProgressUpdate(video.currentTime, video.duration);
    };

    const handleVideoPlay = () => {
      if (!video || !video.duration || !isComponentMounted) return;
      handleStartWatch(video.currentTime, video.duration);
      handleResumeWatch(video.currentTime, video.duration);
    };

    const handleVideoPause = () => {
      if (!video || !video.duration || !isComponentMounted) return;
      handlePauseWatch(video.currentTime, video.duration);
    };

    const handleVideoEnded = () => {
      if (!video || !video.duration || !isComponentMounted) return;
      handleCompleteWatch(video.duration);
    };

    // Add event listeners
    video.addEventListener("timeupdate", handleVideoTimeUpdate);
    video.addEventListener("play", handleVideoPlay);
    video.addEventListener("pause", handleVideoPause);
    video.addEventListener("ended", handleVideoEnded);

    return () => {
      isComponentMounted = false;

      // Cleanup HLS với utility function
      cleanupHls(hlsRef.current);
      hlsRef.current = null;

      // Remove event listeners
      if (video) {
        video.removeEventListener("timeupdate", handleVideoTimeUpdate);
        video.removeEventListener("play", handleVideoPlay);
        video.removeEventListener("pause", handleVideoPause);
        video.removeEventListener("ended", handleVideoEnded);
      }
    };
  }, [
    selectedServer.server_data,
    selectedEpisode.slug,
    loadSavedProgress,
    handleStartWatch,
    handleProgressUpdate,
    handleCompleteWatch,
    handlePauseWatch,
    handleResumeWatch,
  ]);

  const handlePlay = () => {
    const video = videoRef.current;
    if (video && canPlay) {
      video.play().catch((error) => {
        console.error("Error playing video:", error);
        setError("Không thể phát video.");
      });
    }
  };

  // Cleanup callback cho VideoElementWrapper
  const handleVideoCleanup = useCallback(() => {
    // Cleanup HLS instance với utility function
    cleanupHls(hlsRef.current);
    hlsRef.current = null;

    // Reset video source
    const video = videoRef.current;
    if (video) {
      try {
        video.pause();
        video.removeAttribute("src");
        video.load();
      } catch (e) {
        console.warn("Error cleaning up video in wrapper:", e);
      }
    }
  }, []);

  return (
    <VideoElementWrapper onCleanup={handleVideoCleanup}>
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
    </VideoElementWrapper>
  );
}
