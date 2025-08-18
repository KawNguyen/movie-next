"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function addToWatchHistory(watchData: {
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl?: string;
  thumbUrl?: string;
  episodeId?: string;
  episodeName?: string;
  progress?: number;
  duration?: number;
}) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Bạn cần đăng nhập để lưu lịch sử xem");
    }

    // Upsert watch history (update if exists, create if not)
    const watchHistory = await prisma.watchHistory.upsert({
      where: {
        userId_movieId_episodeId: {
          userId: session.user.id,
          movieId: watchData.movieId,
          episodeId: watchData.episodeId || "",
        },
      },
      update: {
        watchedAt: new Date(),
        progress: watchData.progress || 0,
        duration: watchData.duration || 0,
        episodeName: watchData.episodeName,
        posterUrl: watchData.posterUrl,
        thumbUrl: watchData.thumbUrl,
      },
      create: {
        userId: session.user.id,
        movieId: watchData.movieId,
        movieSlug: watchData.movieSlug,
        movieName: watchData.movieName,
        posterUrl: watchData.posterUrl,
        thumbUrl: watchData.thumbUrl,
        episodeId: watchData.episodeId || "",
        episodeName: watchData.episodeName,
        progress: watchData.progress || 0,
        duration: watchData.duration || 0,
      },
    });

    revalidatePath("/lich-su-xem");
    return { success: true, data: watchHistory };
  } catch (error) {
    console.error("Add to watch history error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Có lỗi xảy ra",
    };
  }
}

export async function getWatchHistory() {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Bạn cần đăng nhập" };
    }

    const watchHistory = await prisma.watchHistory.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        watchedAt: "desc",
      },
    });

    return { success: true, data: watchHistory };
  } catch (error) {
    console.error("Get watch history error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Có lỗi xảy ra",
    };
  }
}

export async function removeFromWatchHistory(
  movieId: string,
  episodeId?: string,
) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Bạn cần đăng nhập để xóa lịch sử xem");
    }

    // Normalize episodeId - phải match với cách lưu trong addToWatchHistory
    const normalizedEpisodeId = episodeId || "";

    // Tìm record trước để verify nó tồn tại
    const existingRecord = await prisma.watchHistory.findUnique({
      where: {
        userId_movieId_episodeId: {
          userId: session.user.id,
          movieId: movieId,
          episodeId: normalizedEpisodeId,
        },
      },
    });

    if (!existingRecord) {
      console.warn(
        "Exact watch history record not found. Trying to delete all records for this movie...",
      );

      // Fallback: Delete tất cả records của movie này cho user
      const deletedRecords = await prisma.watchHistory.deleteMany({
        where: {
          userId: session.user.id,
          movieId: movieId,
        },
      });

      if (deletedRecords.count === 0) {
        return {
          success: false,
          error: "Không tìm thấy bản ghi lịch sử xem để xóa",
        };
      }

      revalidatePath("/lich-su-xem");
      return { success: true };
    }

    // Remove from watch history
    await prisma.watchHistory.delete({
      where: {
        userId_movieId_episodeId: {
          userId: session.user.id,
          movieId: movieId,
          episodeId: normalizedEpisodeId,
        },
      },
    });

    revalidatePath("/lich-su-xem");
    return { success: true };
  } catch (error) {
    console.error("Remove from watch history error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Có lỗi xảy ra",
    };
  }
}

export async function getWatchProgress(movieId: string, episodeId?: string) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: true, data: null };
    }

    const watchHistory = await prisma.watchHistory.findUnique({
      where: {
        userId_movieId_episodeId: {
          userId: session.user.id,
          movieId: movieId,
          episodeId: episodeId || "",
        },
      },
    });

    return { success: true, data: watchHistory };
  } catch (error) {
    console.error("Get watch progress error:", error);
    return { success: false, data: null };
  }
}

export async function removeMovieFromWatchHistory(movieId: string) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Bạn cần đăng nhập để xóa lịch sử xem");
    }

    // Remove all watch history records for this movie
    const deletedRecords = await prisma.watchHistory.deleteMany({
      where: {
        userId: session.user.id,
        movieId: movieId,
      },
    });

    revalidatePath("/lich-su-xem");
    return {
      success: true,
      deletedCount: deletedRecords.count,
    };
  } catch (error) {
    console.error("Remove movie from watch history error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Có lỗi xảy ra",
    };
  }
}

export async function clearWatchHistory() {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Bạn cần đăng nhập để xóa lịch sử xem");
    }

    // Remove all watch history for user
    await prisma.watchHistory.deleteMany({
      where: {
        userId: session.user.id,
      },
    });

    revalidatePath("/lich-su-xem");
    return { success: true };
  } catch (error) {
    console.error("Clear watch history error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Có lỗi xảy ra",
    };
  }
}
