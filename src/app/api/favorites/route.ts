import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

const movieId = z.string().trim().min(1).max(200);
const addFavoriteSchema = z.object({
  movieId,
  movieSlug: z.string().trim().min(1).max(200),
  movieName: z.string().trim().min(1).max(300),
  posterUrl: z.string().max(2000).nullable().optional(),
  movieType: z.string().max(50).nullable().optional(),
});

const removeFavoriteSchema = z.object({
  action: z.literal("remove"),
  movieId,
});

const responseHeaders = { "Cache-Control": "private, no-store" };

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id;
}

function jsonBody(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { ...responseHeaders, ...init?.headers },
  });
}

function validationError(error: z.ZodError) {
  return jsonBody(
    {
      error: "Invalid request body",
      issues: error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      })),
    },
    { status: 400 },
  );
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return jsonBody({ data: [], authenticated: false });

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return jsonBody({ data: favorites, authenticated: true });
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return jsonBody({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return jsonBody({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "action" in body &&
    body.action === "remove"
  ) {
    const parsed = removeFavoriteSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    await prisma.favorite.deleteMany({
      where: { userId, movieId: parsed.data.movieId },
    });
    return jsonBody({ success: true });
  }

  const parsed = addFavoriteSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_movieId: {
        userId,
        movieId: parsed.data.movieId,
      },
    },
  });

  if (!existing) {
    const count = await prisma.favorite.count({ where: { userId } });
    if (count >= 500) {
      return jsonBody({ error: "Favorites limit reached" }, { status: 409 });
    }
  }

  const favorite = await prisma.favorite.upsert({
    where: {
      userId_movieId: {
        userId,
        movieId: parsed.data.movieId,
      },
    },
    update: {
      movieSlug: parsed.data.movieSlug,
      movieName: parsed.data.movieName,
      posterUrl: parsed.data.posterUrl ?? null,
      movieType: parsed.data.movieType ?? null,
    },
    create: {
      userId,
      movieId: parsed.data.movieId,
      movieSlug: parsed.data.movieSlug,
      movieName: parsed.data.movieName,
      posterUrl: parsed.data.posterUrl ?? null,
      movieType: parsed.data.movieType ?? null,
    },
  });

  return jsonBody({ data: favorite });
}
