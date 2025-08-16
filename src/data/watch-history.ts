import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface WatchHistoryMovie {
  id: string;
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl: string | null;
  thumbUrl: string | null;
  episodeId: string | null;
  episodeName: string | null;
  watchedAt: Date;
  progress: number;
  duration: number;
}

/**
 * Lấy danh sách lịch sử xem phim của người dùng
 */
export async function getWatchHistoryMovies(): Promise<{
  success: boolean;
  data?: WatchHistoryMovie[];
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Người dùng chưa đăng nhập",
      };
    }

    const watchHistory = await prisma.watchHistory.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        watchedAt: "desc",
      },
    });

    const watchHistoryMovies: WatchHistoryMovie[] = watchHistory.map(
      (item) => ({
        id: item.id,
        movieId: item.movieId,
        movieSlug: item.movieSlug,
        movieName: item.movieName,
        posterUrl: item.posterUrl,
        thumbUrl: item.thumbUrl,
        episodeId: item.episodeId,
        episodeName: item.episodeName,
        watchedAt: item.watchedAt,
        progress: item.progress,
        duration: item.duration,
      })
    );

    return {
      success: true,
      data: watchHistoryMovies,
    };
  } catch (error) {
    console.error("Error fetching watch history:", error);
    return {
      success: false,
      error: "Không thể lấy lịch sử xem phim",
    };
  }
}

/**
 * Lấy danh sách phim để tiếp tục xem (chưa xem hết)
 */
export async function getContinueWatchingMovies(limit = 10): Promise<{
  success: boolean;
  data?: WatchHistoryMovie[];
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Người dùng chưa đăng nhập",
      };
    }

    const watchHistory = await prisma.watchHistory.findMany({
      where: {
        userId: session.user.id,
        duration: {
          gt: 0, // Đảm bảo có duration
        },
      },
      orderBy: {
        watchedAt: "desc",
      },
    });

    const continueWatchingMovies: WatchHistoryMovie[] = watchHistory
      .filter((item) => {
        // Filter trên application level để đảm bảo logic chính xác
        const progressPercent = (item.progress / item.duration) * 100;
        return progressPercent < 95 && progressPercent > 5; // Từ 5% đến 95%
      })
      .slice(0, limit) // Apply limit after filtering
      .map((item) => ({
        id: item.id,
        movieId: item.movieId,
        movieSlug: item.movieSlug,
        movieName: item.movieName,
        posterUrl: item.posterUrl,
        thumbUrl: item.thumbUrl,
        episodeId: item.episodeId,
        episodeName: item.episodeName,
        watchedAt: item.watchedAt,
        progress: item.progress,
        duration: item.duration,
      }));

    return {
      success: true,
      data: continueWatchingMovies,
    };
  } catch (error) {
    console.error("Error fetching continue watching movies:", error);
    return {
      success: false,
      error: "Không thể lấy danh sách phim tiếp tục xem",
    };
  }
}

/**
 * Lấy thống kê lịch sử xem
 */
export async function getWatchHistoryStats(): Promise<{
  success: boolean;
  data?: {
    total: number;
    totalWatchTime: number; // Tổng thời gian xem (giây)
    uniqueMovies: number; // Số phim khác nhau đã xem
    completedMovies: number; // Số phim đã xem hết
    watchedToday: number; // Số lần xem hôm nay
    averageProgress: number; // Tiến trình xem trung bình (%)
  };
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Người dùng chưa đăng nhập",
      };
    }

    const [allHistory, uniqueMovieCount, todayHistory] = await Promise.all([
      // Tất cả lịch sử xem
      prisma.watchHistory.findMany({
        where: {
          userId: session.user.id,
        },
      }),

      // Số phim khác nhau đã xem
      prisma.watchHistory.findMany({
        where: {
          userId: session.user.id,
        },
        distinct: ["movieId"],
        select: {
          movieId: true,
        },
      }),

      // Lịch sử xem hôm nay
      prisma.watchHistory.count({
        where: {
          userId: session.user.id,
          watchedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    const totalWatchTime = allHistory.reduce(
      (sum, item) => sum + item.progress,
      0
    );
    const completedMovies = allHistory.filter((item) => {
      if (item.duration === 0) return false;
      return (item.progress / item.duration) * 100 >= 95;
    }).length;

    const averageProgress =
      allHistory.length > 0
        ? allHistory.reduce((sum, item) => {
            if (item.duration === 0) return sum;
            return sum + (item.progress / item.duration) * 100;
          }, 0) / allHistory.length
        : 0;

    return {
      success: true,
      data: {
        total: allHistory.length,
        totalWatchTime,
        uniqueMovies: uniqueMovieCount.length,
        completedMovies,
        watchedToday: todayHistory,
        averageProgress: Math.round(averageProgress * 100) / 100,
      },
    };
  } catch (error) {
    console.error("Error fetching watch history stats:", error);
    return {
      success: false,
      error: "Không thể lấy thống kê lịch sử xem",
    };
  }
}

/**
 * Tìm kiếm trong lịch sử xem
 */
export async function searchWatchHistory(query: string): Promise<{
  success: boolean;
  data?: WatchHistoryMovie[];
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Người dùng chưa đăng nhập",
      };
    }

    const watchHistory = await prisma.watchHistory.findMany({
      where: {
        userId: session.user.id,
        OR: [
          {
            movieName: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            episodeName: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      orderBy: {
        watchedAt: "desc",
      },
    });

    const watchHistoryMovies: WatchHistoryMovie[] = watchHistory.map(
      (item) => ({
        id: item.id,
        movieId: item.movieId,
        movieSlug: item.movieSlug,
        movieName: item.movieName,
        posterUrl: item.posterUrl,
        thumbUrl: item.thumbUrl,
        episodeId: item.episodeId,
        episodeName: item.episodeName,
        watchedAt: item.watchedAt,
        progress: item.progress,
        duration: item.duration,
      })
    );

    return {
      success: true,
      data: watchHistoryMovies,
    };
  } catch (error) {
    console.error("Error searching watch history:", error);
    return {
      success: false,
      error: "Không thể tìm kiếm lịch sử xem",
    };
  }
}

/**
 * Lấy lịch sử xem theo movieId
 */
export async function getWatchHistoryByMovie(movieId: string): Promise<{
  success: boolean;
  data?: WatchHistoryMovie[];
  error?: string;
}> {
  try {
    // Validate movieId
    if (!movieId || typeof movieId !== "string" || !movieId.trim()) {
      return {
        success: true,
        data: [],
      };
    }

    // Clean movieId
    const cleanMovieId = movieId.trim();

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Người dùng chưa đăng nhập",
      };
    }

    const watchHistory = await prisma.watchHistory.findMany({
      where: {
        userId: session.user.id,
        movieId: cleanMovieId,
      },
      orderBy: {
        watchedAt: "desc",
      },
    });

    const watchHistoryMovies: WatchHistoryMovie[] = watchHistory.map(
      (item) => ({
        id: item.id,
        movieId: item.movieId,
        movieSlug: item.movieSlug,
        movieName: item.movieName,
        posterUrl: item.posterUrl,
        thumbUrl: item.thumbUrl,
        episodeId: item.episodeId,
        episodeName: item.episodeName,
        watchedAt: item.watchedAt,
        progress: item.progress,
        duration: item.duration,
      })
    );

    return {
      success: true,
      data: watchHistoryMovies,
    };
  } catch (error) {
    console.error("Error fetching watch history by movie:", error);
    return {
      success: false,
      error: "Không thể lấy lịch sử xem của phim",
    };
  }
}
