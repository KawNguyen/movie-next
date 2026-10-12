import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

const id = z.string().trim().min(1).max(200);
const saveSchema = z.object({
  action: z.undefined().optional(),
  movieId: id,
  movieSlug: id,
  movieName: z.string().trim().min(1).max(300),
  posterUrl: z.string().max(2000).optional().nullable(),
  thumbUrl: z.string().max(2000).optional().nullable(),
  episodeId: id,
  serverSlug: id,
  episodeName: z.string().trim().min(1).max(300),
  progress: z.number().min(0).max(86400),
  duration: z.number().positive().max(86400),
  completed: z.boolean().optional(),
  updatedAt: z.string().datetime({ offset: true }).optional(),
});

const removeSchema = z.object({
  action: z.literal("remove"),
  movieId: id,
  episodeId: id.optional(),
});

const clearSchema = z.object({
  action: z.literal("clear"),
});

const responseHeaders = { "Cache-Control": "private, no-store" };

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id;
}

function validationError(error: z.ZodError) {
  return NextResponse.json(
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

function jsonBody(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { ...responseHeaders, ...init?.headers },
  });
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return jsonBody({ data: [], authenticated: false });

  const history = await prisma.watchHistory.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 2000,
  });
  return jsonBody({ data: history, authenticated: true });
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return jsonBody({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return jsonBody({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = z
    .object({ action: z.string().optional() })
    .safeParse(body);
  if (action.success && action.data.action === "remove") {
    const parsed = removeSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    await prisma.watchHistory.deleteMany({
      where: {
        userId,
        movieId: parsed.data.movieId,
        ...(parsed.data.episodeId
          ? { episodeId: parsed.data.episodeId }
          : {}),
      },
    });
    return jsonBody({ success: true });
  }

  if (action.success && action.data.action === "clear") {
    const parsed = clearSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    await prisma.watchHistory.deleteMany({ where: { userId } });
    return jsonBody({ success: true });
  }

  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const input = parsed.data;
  const now = new Date();
  const requestedUpdatedAt = input.updatedAt
    ? new Date(input.updatedAt)
    : now;
  const updatedAt =
    requestedUpdatedAt.getTime() > now.getTime() + 5 * 60 * 1000
      ? now
      : requestedUpdatedAt;
  const progress = Math.min(Math.floor(input.progress), Math.floor(input.duration));
  const completed =
    input.completed === true ||
    input.duration - progress <= 90 ||
    progress / input.duration >= 0.95;

  if (!completed && progress < 3) {
    return jsonBody({ success: true, skipped: true });
  }

  const savedProgress = completed ? 0 : progress;
  const data = {
    userId,
    movieId: input.movieId,
    movieSlug: input.movieSlug,
    movieName: input.movieName,
    posterUrl: input.posterUrl || null,
    thumbUrl: input.thumbUrl || null,
    episodeId: input.episodeId,
    serverSlug: input.serverSlug,
    episodeName: input.episodeName,
    progress: savedProgress,
    duration: Math.floor(input.duration),
    completed,
    updatedAt,
  };

  const history = await prisma.$transaction(async (tx) => {
    await tx.watchHistory.createMany({
      data,
      skipDuplicates: true,
    });
    await tx.watchHistory.updateMany({
      where: {
        userId,
        movieId: input.movieId,
        episodeId: input.episodeId,
        updatedAt: { lt: updatedAt },
      },
      data,
    });

    const movies = await tx.watchHistory.groupBy({
      by: ["movieId"],
      where: { userId },
      orderBy: { _max: { updatedAt: "desc" } },
      skip: 50,
      _max: { updatedAt: true },
    });
    if (movies.length > 0) {
      await tx.watchHistory.deleteMany({
        where: {
          userId,
          movieId: { in: movies.map((movie) => movie.movieId) },
        },
      });
    }

    return tx.watchHistory.findUnique({
      where: {
        userId_movieId_episodeId: {
          userId,
          movieId: input.movieId,
          episodeId: input.episodeId,
        },
      },
    });
  });

  return jsonBody({ data: history });
}
