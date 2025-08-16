import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface FavoriteMovie {
  id: string;
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl: string | null;
  movieType: string | null;
  createdAt: Date;
}

/**
 * Lấy danh sách phim yêu thích của người dùng
 */
export async function getFavoriteMovies(): Promise<{
  success: boolean;
  data?: FavoriteMovie[];
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

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const favoriteMovies: FavoriteMovie[] = favorites.map((favorite) => ({
      id: favorite.id,
      movieId: favorite.movieId,
      movieSlug: favorite.movieSlug,
      movieName: favorite.movieName,
      posterUrl: favorite.posterUrl,
      movieType: favorite.movieType,
      createdAt: favorite.createdAt,
    }));

    return {
      success: true,
      data: favoriteMovies,
    };
  } catch (error) {
    console.error("Error fetching favorite movies:", error);
    return {
      success: false,
      error: "Không thể lấy danh sách phim yêu thích",
    };
  }
}

/**
 * Kiểm tra xem phim có trong danh sách yêu thích không
 */
export async function isFavoriteMovie(movieId: string): Promise<{
  success: boolean;
  data?: boolean;
  error?: string;
}> {
  try {
    // Validate movieId
    if (!movieId || typeof movieId !== "string" || !movieId.trim()) {
      return {
        success: true,
        data: false,
      };
    }

    // Clean movieId
    const cleanMovieId = movieId.trim();

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: true,
        data: false,
      };
    }

    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        movieId: cleanMovieId,
      },
    });

    return {
      success: true,
      data: !!favorite,
    };
  } catch (error) {
    console.error("Error checking favorite status:", error);
    return {
      success: false,
      error: "Không thể kiểm tra trạng thái yêu thích",
    };
  }
}

/**
 * Lấy thống kê phim yêu thích
 */
export async function getFavoriteStats(): Promise<{
  success: boolean;
  data?: {
    total: number;
    movieTypes: { type: string; count: number }[];
    recentlyAdded: number; // Số phim được thêm trong 7 ngày qua
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

    const [totalCount, movieTypes, recentCount] = await Promise.all([
      // Tổng số phim yêu thích
      prisma.favorite.count({
        where: {
          userId: session.user.id,
        },
      }),

      // Thống kê theo loại phim
      prisma.favorite.groupBy({
        by: ["movieType"],
        where: {
          userId: session.user.id,
          movieType: {
            not: null,
          },
        },
        _count: {
          movieType: true,
        },
      }),

      // Số phim được thêm trong 7 ngày qua
      prisma.favorite.count({
        where: {
          userId: session.user.id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const movieTypeStats = movieTypes.map((item) => ({
      type: item.movieType || "Không xác định",
      count: item._count.movieType,
    }));

    return {
      success: true,
      data: {
        total: totalCount,
        movieTypes: movieTypeStats,
        recentlyAdded: recentCount,
      },
    };
  } catch (error) {
    console.error("Error fetching favorite stats:", error);
    return {
      success: false,
      error: "Không thể lấy thống kê phim yêu thích",
    };
  }
}

/**
 * Tìm kiếm trong danh sách phim yêu thích
 */
export async function searchFavoriteMovies(query: string): Promise<{
  success: boolean;
  data?: FavoriteMovie[];
  error?: string;
}> {
  try {
    // Validate query
    if (!query || typeof query !== "string" || !query.trim()) {
      return {
        success: true,
        data: [],
      };
    }

    // Clean query
    const cleanQuery = query.trim();

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Người dùng chưa đăng nhập",
      };
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
        movieName: {
          contains: cleanQuery,
          mode: "insensitive",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const favoriteMovies: FavoriteMovie[] = favorites.map((favorite) => ({
      id: favorite.id,
      movieId: favorite.movieId,
      movieSlug: favorite.movieSlug,
      movieName: favorite.movieName,
      posterUrl: favorite.posterUrl,
      movieType: favorite.movieType,
      createdAt: favorite.createdAt,
    }));

    return {
      success: true,
      data: favoriteMovies,
    };
  } catch (error) {
    console.error("Error searching favorite movies:", error);
    return {
      success: false,
      error: "Không thể tìm kiếm phim yêu thích",
    };
  }
}
