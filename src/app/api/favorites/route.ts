import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

const MAX_FAVORITES = 500;
const MAX_BULK_ITEMS = 100;

const movieId = z.string().trim().min(1).max(200);

const addFavoriteSchema = z.object({
  movieId,
  movieSlug: z.string().trim().min(1).max(200),
  movieName: z.string().trim().min(1).max(300),
  posterUrl: z.string().max(2000).nullable().optional(),
  movieType: z.string().max(50).nullable().optional(),
  createdAt: z.string().datetime({ offset: true }).optional(),
});

const bulkSchema = z.object({
  action: z.literal("bulk"),
  items: z.array(addFavoriteSchema).min(1).max(MAX_BULK_ITEMS),
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

/**
 * Thêm nhiều phim yêu thích bằng đúng 3 câu SQL (không phụ thuộc số lượng item):
 * lấy phim đã có -> đếm -> createMany(skipDuplicates).
 * Phim đã tồn tại thì bỏ qua; quá giới hạn thì từ chối phần dư (giữ các item đứng trước, tức mới nhất).
 */
async function addMany(
  userId: string,
  items: z.infer<typeof addFavoriteSchema>[],
) {
  const byId = new Map(items.map((i) => [i.movieId, i]));
  const unique = [...byId.values()];

  const existing = await prisma.favorite.findMany({
    where: { userId, movieId: { in: unique.map((i) => i.movieId) } },
    select: { movieId: true },
  });
  const have = new Set(existing.map((e) => e.movieId));
  const fresh = unique.filter((i) => !have.has(i.movieId));
  if (fresh.length === 0) return { added: 0, rejected: 0 };

  const total = await prisma.favorite.count({ where: { userId } });
  const room = Math.max(0, MAX_FAVORITES - total);
  const toAdd = fresh.slice(0, room);

  if (toAdd.length > 0) {
    await prisma.favorite.createMany({
      data: toAdd.map((i) => ({
        userId,
        movieId: i.movieId,
        movieSlug: i.movieSlug,
        movieName: i.movieName,
        posterUrl: i.posterUrl ?? null,
        movieType: i.movieType ?? null,
        createdAt: i.createdAt ? new Date(i.createdAt) : undefined,
      })),
      skipDuplicates: true,
    });
  }

  return { added: toAdd.length, rejected: fresh.length - toAdd.length };
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return jsonBody({ data: [], authenticated: false });

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: MAX_FAVORITES,
    select: {
      id: true,
      movieId: true,
      movieSlug: true,
      movieName: true,
      posterUrl: true,
      movieType: true,
      createdAt: true,
    },
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

  const action = (body as { action?: unknown } | null)?.action;

  /* ----- remove ----- */
  if (action === "remove") {
    const parsed = removeFavoriteSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    await prisma.favorite.deleteMany({
      where: { userId, movieId: parsed.data.movieId },
    });
    return jsonBody({ success: true });
  }

  /* ----- bulk (đồng bộ lần đầu / sau đăng nhập) ----- */
  if (action === "bulk") {
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const { added, rejected } = await addMany(userId, parsed.data.items);
    return jsonBody({ success: true, added, rejected });
  }

  /* ----- add 1 phim ----- */
  const parsed = addFavoriteSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { rejected } = await addMany(userId, [parsed.data]);
  if (rejected > 0) {
    return jsonBody({ error: "Favorites limit reached" }, { status: 409 });
  }
  return jsonBody({ success: true });
}