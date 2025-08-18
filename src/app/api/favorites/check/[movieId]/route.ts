import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    const { movieId: rawMovieId } = await params;
    const movieId = decodeURIComponent(rawMovieId);

    if (!movieId || typeof movieId !== "string" || movieId.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Invalid movie ID" },
        { status: 400 }
      );
    }

    // Get current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({
        success: true,
        data: false, // Not logged in = not favorite
      });
    }

    // Check if movie is favorite
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_movieId: {
          userId: session.user.id,
          movieId: movieId.trim(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: !!favorite,
    });
  } catch (error) {
    console.error("Error checking favorite:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
