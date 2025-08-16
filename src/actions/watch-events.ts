"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { WatchEventService } from "@/services/watch-event.service";
import { WatchEvent, WatchEventType } from "@/types/watch-events.types";

interface WatchEventData {
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl?: string;
  thumbUrl?: string;
  episodeId: string;
  episodeName: string;
  progress: number;
  duration: number;
}

/**
 * Gửi watch event
 */
export async function sendWatchEvent(
  eventType: WatchEventType,
  data: WatchEventData
) {
  try {
    // Validate essential data
    if (
      !data.movieId ||
      typeof data.movieId !== "string" ||
      !data.movieId.trim()
    ) {
      return {
        success: false,
        error: "MovieId không hợp lệ",
      };
    }

    if (
      !data.episodeId ||
      typeof data.episodeId !== "string" ||
      !data.episodeId.trim()
    ) {
      return {
        success: false,
        error: "EpisodeId không hợp lệ",
      };
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    const event: WatchEvent = {
      type: eventType,
      userId: session.user.id,
      movieId: data.movieId.trim(),
      movieSlug: data.movieSlug,
      movieName: data.movieName,
      posterUrl: data.posterUrl,
      thumbUrl: data.thumbUrl,
      episodeId: data.episodeId.trim(),
      episodeName: data.episodeName,
      progress: Math.floor(data.progress),
      duration: Math.floor(data.duration),
      timestamp: new Date(),
    };

    const result = await WatchEventService.handleWatchEvent(event);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error sending watch event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Bắt đầu xem phim
 */
export async function startWatching(data: WatchEventData) {
  return await sendWatchEvent("START_WATCH", data);
}

/**
 * Cập nhật tiến độ xem
 */
export async function updateWatchProgress(data: WatchEventData) {
  return await sendWatchEvent("PROGRESS_UPDATE", data);
}

/**
 * Hoàn thành xem phim
 */
export async function completeWatching(data: WatchEventData) {
  return await sendWatchEvent("COMPLETE_WATCH", data);
}

/**
 * Tạm dừng xem phim
 */
export async function pauseWatching(data: WatchEventData) {
  return await sendWatchEvent("PAUSE_WATCH", data);
}

/**
 * Tiếp tục xem phim
 */
export async function resumeWatching(data: WatchEventData) {
  return await sendWatchEvent("RESUME_WATCH", data);
}

/**
 * Lấy danh sách phim đang xem (continue watching)
 */
export async function getContinueWatchingList(limit = 10) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        error: "User not authenticated",
        data: [],
      };
    }

    const result = await WatchEventService.getContinueWatching(
      session.user.id,
      limit
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error getting continue watching list:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: [],
    };
  }
}

/**
 * Lấy danh sách phim đã xem hoàn thành
 */
export async function getCompletedWatchList(limit = 20) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        error: "User not authenticated",
        data: [],
      };
    }

    const result = await WatchEventService.getCompletedWatch(
      session.user.id,
      limit
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error getting completed watch list:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: [],
    };
  }
}

/**
 * Lấy tất cả lịch sử xem
 */
export async function getAllWatchHistoryList(limit = 50) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        error: "User not authenticated",
        data: [],
      };
    }

    const result = await WatchEventService.getAllWatchHistory(
      session.user.id,
      limit
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error getting watch history:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: [],
    };
  }
}

/**
 * Lấy tiến độ xem của một episode cụ thể (để restore)
 */
export async function getWatchProgressForEpisode(
  movieId: string,
  episodeId: string
) {
  try {
    // Validate parameters
    if (!movieId || typeof movieId !== "string" || !movieId.trim()) {
      return {
        success: false,
        error: "MovieId không hợp lệ",
        data: null,
      };
    }

    if (!episodeId || typeof episodeId !== "string" || !episodeId.trim()) {
      return {
        success: false,
        error: "EpisodeId không hợp lệ",
        data: null,
      };
    }

    // Clean parameters
    const cleanMovieId = movieId.trim();
    const cleanEpisodeId = episodeId.trim();

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        error: "User not authenticated",
        data: null,
      };
    }

    const result = await WatchEventService.getAllWatchHistory(
      session.user.id,
      1000
    );
    const episodeRecord = result.find(
      (record) =>
        record.movieId === cleanMovieId && record.episodeId === cleanEpisodeId
    );

    return {
      success: true,
      data: episodeRecord || null,
    };
  } catch (error) {
    console.error("Error getting episode watch progress:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: null,
    };
  }
}
