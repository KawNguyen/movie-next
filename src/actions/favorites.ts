"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function addToFavorites(movieData: {
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl?: string;
  movieType?: string;
}) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Bạn cần đăng nhập để thêm phim yêu thích");
    }

    // Check if movie already in favorites
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_movieId: {
          userId: session.user.id,
          movieId: movieData.movieId,
        },
      },
    });

    if (existingFavorite) {
      throw new Error("Phim đã có trong danh sách yêu thích");
    }

    // Add to favorites
    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        movieId: movieData.movieId,
        movieSlug: movieData.movieSlug,
        movieName: movieData.movieName,
        posterUrl: movieData.posterUrl,
        movieType: movieData.movieType || "single",
      },
    });

    revalidatePath("/yeu-thich");
    return { success: true, data: favorite };
  } catch (error) {
    console.error("Add to favorites error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Có lỗi xảy ra",
    };
  }
}

export async function removeFromFavorites(movieId: string) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Bạn cần đăng nhập để xóa phim yêu thích");
    }

    // Remove from favorites
    await prisma.favorite.delete({
      where: {
        userId_movieId: {
          userId: session.user.id,
          movieId: movieId,
        },
      },
    });

    revalidatePath("/yeu-thich");
    return { success: true };
  } catch (error) {
    console.error("Remove from favorites error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Có lỗi xảy ra",
    };
  }
}

export async function getFavorites() {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Bạn cần đăng nhập" };
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: favorites };
  } catch (error) {
    console.error("Get favorites error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Có lỗi xảy ra",
    };
  }
}

export async function checkIsFavorite(movieId: string) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: true, data: false };
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_movieId: {
          userId: session.user.id,
          movieId: movieId,
        },
      },
    });

    return { success: true, data: !!favorite };
  } catch (error) {
    console.error("Check favorite error:", error);
    return { success: false, data: false };
  }
}
