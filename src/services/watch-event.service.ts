import { prisma } from "@/lib/prisma";
import { WatchEvent } from "@/types/watch-events.types";
import type { WatchHistory } from "@prisma/client";

export class WatchEventService {
  private static readonly COMPLETION_THRESHOLD = 0.9; // 90% completion threshold
  private static readonly PROGRESS_UPDATE_INTERVAL = 10; // 10 seconds minimum between updates

  /**
   * Xử lý watch event
   */
  static async handleWatchEvent(event: WatchEvent) {
    try {
      switch (event.type) {
        case "START_WATCH":
          return await this.handleStartWatch(event);
        case "PROGRESS_UPDATE":
          return await this.handleProgressUpdate(event);
        case "COMPLETE_WATCH":
          return await this.handleCompleteWatch(event);
        case "PAUSE_WATCH":
          return await this.handlePauseWatch(event);
        case "RESUME_WATCH":
          return await this.handleResumeWatch(event);
        default:
          throw new Error(`Unknown watch event type: ${event.type}`);
      }
    } catch (error) {
      console.error("Error handling watch event:", error);
      throw error;
    }
  }

  /**
   * Bắt đầu xem phim
   */
  private static async handleStartWatch(event: WatchEvent) {
    return await prisma.watchHistory.upsert({
      where: {
        userId_movieId_episodeId: {
          userId: event.userId,
          movieId: event.movieId,
          episodeId: event.episodeId,
        },
      },
      update: {
        watchedAt: event.timestamp,
        progress: event.progress,
        duration: event.duration,
        movieName: event.movieName,
        posterUrl: event.posterUrl,
        thumbUrl: event.thumbUrl,
        episodeName: event.episodeName,
      },
      create: {
        userId: event.userId,
        movieId: event.movieId,
        movieSlug: event.movieSlug,
        movieName: event.movieName,
        posterUrl: event.posterUrl,
        thumbUrl: event.thumbUrl,
        episodeId: event.episodeId,
        episodeName: event.episodeName,
        watchedAt: event.timestamp,
        progress: event.progress,
        duration: event.duration,
      },
    });
  }

  /**
   * Cập nhật tiến độ xem
   */
  private static async handleProgressUpdate(event: WatchEvent) {
    // Chỉ update nếu progress thay đổi đáng kể (ít nhất 5 giây)
    const existingRecord = await prisma.watchHistory.findUnique({
      where: {
        userId_movieId_episodeId: {
          userId: event.userId,
          movieId: event.movieId,
          episodeId: event.episodeId,
        },
      },
    });

    if (
      existingRecord &&
      Math.abs(existingRecord.progress - event.progress) < 5
    ) {
      return existingRecord; // Không update nếu chênh lệch nhỏ hơn 5 giây
    }

    return await prisma.watchHistory.upsert({
      where: {
        userId_movieId_episodeId: {
          userId: event.userId,
          movieId: event.movieId,
          episodeId: event.episodeId,
        },
      },
      update: {
        watchedAt: event.timestamp,
        progress: event.progress,
        duration: event.duration,
        movieName: event.movieName,
        posterUrl: event.posterUrl,
        thumbUrl: event.thumbUrl,
        episodeName: event.episodeName,
      },
      create: {
        userId: event.userId,
        movieId: event.movieId,
        movieSlug: event.movieSlug,
        movieName: event.movieName,
        posterUrl: event.posterUrl,
        thumbUrl: event.thumbUrl,
        episodeId: event.episodeId,
        episodeName: event.episodeName,
        watchedAt: event.timestamp,
        progress: event.progress,
        duration: event.duration,
      },
    });
  }

  /**
   * Hoàn thành xem phim
   */
  private static async handleCompleteWatch(event: WatchEvent) {
    return await prisma.watchHistory.upsert({
      where: {
        userId_movieId_episodeId: {
          userId: event.userId,
          movieId: event.movieId,
          episodeId: event.episodeId,
        },
      },
      update: {
        watchedAt: event.timestamp,
        progress: event.duration, // Set progress = duration for completion
        duration: event.duration,
        movieName: event.movieName,
        posterUrl: event.posterUrl,
        thumbUrl: event.thumbUrl,
        episodeName: event.episodeName,
      },
      create: {
        userId: event.userId,
        movieId: event.movieId,
        movieSlug: event.movieSlug,
        movieName: event.movieName,
        posterUrl: event.posterUrl,
        thumbUrl: event.thumbUrl,
        episodeId: event.episodeId,
        episodeName: event.episodeName,
        watchedAt: event.timestamp,
        progress: event.duration,
        duration: event.duration,
      },
    });
  }

  /**
   * Tạm dừng xem phim
   */
  private static async handlePauseWatch(event: WatchEvent) {
    return await this.handleProgressUpdate(event);
  }

  /**
   * Tiếp tục xem phim
   */
  private static async handleResumeWatch(event: WatchEvent) {
    return await this.handleProgressUpdate(event);
  }

  /**
   * Lấy danh sách đang xem (5-89% progress)
   */
  static async getContinueWatching(userId: string, limit = 10) {
    const records = await prisma.watchHistory.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        watchedAt: "desc",
      },
      take: limit * 2, // Lấy nhiều hơn để filter
    });

    // Filter records có progress từ 5% đến 89%
    const continueWatchingRecords = records.filter((record: WatchHistory) => {
      if (record.duration <= 0) return false;
      const progressPercent = (record.progress / record.duration) * 100;
      return progressPercent >= 5 && progressPercent < 90;
    });

    return continueWatchingRecords.slice(0, limit);
  }

  /**
   * Lấy danh sách đã xem hoàn thành (>=90% progress)
   */
  static async getCompletedWatch(userId: string, limit = 20) {
    const records = await prisma.watchHistory.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        watchedAt: "desc",
      },
      take: limit * 2,
    });

    const completedRecords = records.filter((record: WatchHistory) => {
      if (record.duration <= 0) return false;
      const progressPercent = (record.progress / record.duration) * 100;
      return progressPercent >= 90;
    });

    return completedRecords.slice(0, limit);
  }

  /**
   * Lấy tất cả lịch sử xem
   */
  static async getAllWatchHistory(userId: string, limit = 50) {
    return await prisma.watchHistory.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        watchedAt: "desc",
      },
      take: limit,
    });
  }
}
