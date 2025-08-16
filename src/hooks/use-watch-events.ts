"use client";

import { useCallback, useRef, useEffect } from "react";
import {
  startWatching,
  updateWatchProgress,
  completeWatching,
  pauseWatching,
  resumeWatching,
  getWatchProgressForEpisode,
} from "@/actions/watch-events";
import { toast } from "sonner";

interface UseWatchEventsProps {
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl?: string;
  thumbUrl?: string;
  episodeId: string;
  episodeName: string;
}

export function useWatchEvents({
  movieId,
  movieSlug,
  movieName,
  posterUrl,
  thumbUrl,
  episodeId,
  episodeName,
}: UseWatchEventsProps) {
  const progressUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressUpdateRef = useRef<number>(0);
  const isWatchingRef = useRef<boolean>(false);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (progressUpdateTimerRef.current) {
        clearTimeout(progressUpdateTimerRef.current);
      }
    };
  }, []);

  // Bắt đầu session xem
  const handleStartWatch = useCallback(
    async (currentTime: number, duration: number) => {
      try {
        isWatchingRef.current = true;
        const result = await startWatching({
          movieId,
          movieSlug,
          movieName,
          posterUrl,
          thumbUrl,
          episodeId,
          episodeName,
          progress: currentTime,
          duration,
        });

        if (!result.success) {
          console.error("Failed to start watching:", result.error);
        }
      } catch (error) {
        console.error("Error starting watch:", error);
      }
    },
    [movieId, movieSlug, movieName, posterUrl, thumbUrl, episodeId, episodeName]
  );

  // Cập nhật tiến độ (throttled)
  const handleProgressUpdate = useCallback(
    async (currentTime: number, duration: number) => {
      if (!isWatchingRef.current) return;

      // Throttle: chỉ update mỗi 10 giây hoặc nếu thay đổi > 5 giây
      const timeDiff = Math.abs(currentTime - lastProgressUpdateRef.current);
      if (timeDiff < 5) return;

      // Clear previous timer
      if (progressUpdateTimerRef.current) {
        clearTimeout(progressUpdateTimerRef.current);
      }

      // Delay update 2 giây để tránh spam
      progressUpdateTimerRef.current = setTimeout(async () => {
        try {
          lastProgressUpdateRef.current = currentTime;
          const result = await updateWatchProgress({
            movieId,
            movieSlug,
            movieName,
            posterUrl,
            thumbUrl,
            episodeId,
            episodeName,
            progress: currentTime,
            duration,
          });

          if (!result.success) {
            console.error("Failed to update progress:", result.error);
          }
        } catch (error) {
          console.error("Error updating progress:", error);
        }
      }, 2000);
    },
    [movieId, movieSlug, movieName, posterUrl, thumbUrl, episodeId, episodeName]
  );

  // Hoàn thành xem
  const handleCompleteWatch = useCallback(
    async (duration: number) => {
      try {
        isWatchingRef.current = false;
        const result = await completeWatching({
          movieId,
          movieSlug,
          movieName,
          posterUrl,
          thumbUrl,
          episodeId,
          episodeName,
          progress: duration,
          duration,
        });

        if (result.success) {
          toast.success("Đã hoàn thành xem tập phim!");
        } else {
          console.error("Failed to complete watching:", result.error);
        }
      } catch (error) {
        console.error("Error completing watch:", error);
      }
    },
    [movieId, movieSlug, movieName, posterUrl, thumbUrl, episodeId, episodeName]
  );

  // Tạm dừng xem
  const handlePauseWatch = useCallback(
    async (currentTime: number, duration: number) => {
      try {
        isWatchingRef.current = false;
        const result = await pauseWatching({
          movieId,
          movieSlug,
          movieName,
          posterUrl,
          thumbUrl,
          episodeId,
          episodeName,
          progress: currentTime,
          duration,
        });

        if (!result.success) {
          console.error("Failed to pause watching:", result.error);
        }
      } catch (error) {
        console.error("Error pausing watch:", error);
      }
    },
    [movieId, movieSlug, movieName, posterUrl, thumbUrl, episodeId, episodeName]
  );

  // Tiếp tục xem
  const handleResumeWatch = useCallback(
    async (currentTime: number, duration: number) => {
      try {
        isWatchingRef.current = true;
        const result = await resumeWatching({
          movieId,
          movieSlug,
          movieName,
          posterUrl,
          thumbUrl,
          episodeId,
          episodeName,
          progress: currentTime,
          duration,
        });

        if (!result.success) {
          console.error("Failed to resume watching:", result.error);
        }
      } catch (error) {
        console.error("Error resuming watch:", error);
      }
    },
    [movieId, movieSlug, movieName, posterUrl, thumbUrl, episodeId, episodeName]
  );

  // Lấy tiến độ đã lưu
  const getSavedProgress = useCallback(async () => {
    try {
      const result = await getWatchProgressForEpisode(movieId, episodeId);
      if (result.success && result.data) {
        return result.data.progress || 0;
      }
      return 0;
    } catch (error) {
      console.error("Error getting saved progress:", error);
      return 0;
    }
  }, [movieId, episodeId]);

  return {
    handleStartWatch,
    handleProgressUpdate,
    handleCompleteWatch,
    handlePauseWatch,
    handleResumeWatch,
    getSavedProgress,
  };
}
