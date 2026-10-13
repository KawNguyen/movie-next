import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../../generated/prisma/client";
// Đổi đường dẫn cho khớp project (generator "prisma-client" output ../generated/prisma)

/* ---------- Constants ---------- */

const MAX_MOVIES = 50;
const MAX_ROWS = 2000;
const MAX_BULK_ITEMS = 500;
const MAX_FUTURE_MS = 5 * 60 * 1000;
const COMPLETE_REMAINING_SECONDS = 90;
const COMPLETE_RATIO = 0.95;
const MIN_SAVE_SECONDS = 3;

/* ---------- Validation ---------- */

const id = z.string().trim().min(1).max(200);

const itemSchema = z.object({
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

const bulkSchema = z.object({
  action: z.literal("bulk"),
  items: z.array(itemSchema).min(1).max(MAX_BULK_ITEMS),
});

const removeSchema = z.object({
  action: z.literal("remove"),
  movieId: id,
  episodeId: id.optional(),
});

/* ---------- Helpers ---------- */

const responseHeaders = { "Cache-Control": "private, no-store" };

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
      issues: error.issues.map((i) => ({ path: i.path, message: i.message })),
    },
    { status: 400 },
  );
}

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id;
}

interface Row {
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl: string | null;
  thumbUrl: string | null;
  episodeId: string;
  serverSlug: string;
  episodeName: string;
  progress: number;
  duration: number;
  completed: boolean;
  updatedAt: Date;
}

/** Chuẩn hóa 1 item từ client; trả null nếu nên bỏ qua (dưới 3 giây & chưa xong) */
function toRow(input: z.infer<typeof itemSchema>, now: Date): Row | null {
  const duration = Math.floor(input.duration);
  const progress = Math.min(Math.floor(input.progress), duration);
  const completed =
    input.completed === true ||
    input.duration - progress <= COMPLETE_REMAINING_SECONDS ||
    progress / input.duration >= COMPLETE_RATIO;

  if (!completed && progress < MIN_SAVE_SECONDS) return null;

  const requested = input.updatedAt ? new Date(input.updatedAt) : now;
  const updatedAt =
    requested.getTime() > now.getTime() + MAX_FUTURE_MS ? now : requested;

  return {
    movieId: input.movieId,
    movieSlug: input.movieSlug,
    movieName: input.movieName,
    posterUrl: input.posterUrl || null,
    thumbUrl: input.thumbUrl || null,
    episodeId: input.episodeId,
    serverSlug: input.serverSlug,
    episodeName: input.episodeName,
    progress: completed ? 0 : progress, // xem xong thì reset về 0
    duration,
    completed,
    updatedAt,
  };
}

/**
 * Ghi N tập bằng ĐÚNG 1 câu SQL (INSERT ... ON CONFLICT DO UPDATE ... WHERE).
 * - Bản có updatedAt mới hơn thì thắng, request đến sai thứ tự không ghi đè bản mới.
 * - Không dùng transaction nhiều bước -> ít round-trip tới Neon.
 * - RETURNING (xmax = 0) cho biết dòng nào là INSERT mới, để chỉ dọn dẹp khi cần.
 *
 * Tên bảng/cột lấy từ @@map / @map trong schema.prisma.
 * updatedAt là TIMESTAMP(3) không múi giờ (Prisma lưu UTC), nên ép về UTC rõ ràng.
 */
async function upsertRows(userId: string, rows: Row[]) {
  // Trong 1 câu INSERT không được có 2 dòng trùng khóa -> giữ bản mới nhất
  const byKey = new Map<string, Row>();
  for (const r of rows) {
    const k = `${r.movieId}:${r.episodeId}`;
    const cur = byKey.get(k);
    if (!cur || r.updatedAt > cur.updatedAt) byKey.set(k, r);
  }
  const unique = [...byKey.values()];
  if (unique.length === 0) return { applied: 0, inserted: 0 };

  const values = unique.map(
    (r) =>
      Prisma.sql`(${randomUUID()}, ${userId}, ${r.movieId}, ${r.movieSlug}, ${r.movieName}, ${r.posterUrl}, ${r.thumbUrl}, ${r.episodeId}, ${r.serverSlug}, ${r.episodeName}, ${r.progress}, ${r.duration}, ${r.completed}, (${r.updatedAt.toISOString()}::timestamptz AT TIME ZONE 'UTC'))`,
  );

  const result = await prisma.$queryRaw<{ inserted: boolean }[]>`
    INSERT INTO watch_history
      (id, user_id, movie_id, movie_slug, movie_name, poster_url, thumb_url,
       episode_id, server_slug, episode_name, progress, duration, completed, updated_at)
    VALUES ${Prisma.join(values)}
    ON CONFLICT (user_id, movie_id, episode_id) DO UPDATE SET
      movie_slug   = EXCLUDED.movie_slug,
      movie_name   = EXCLUDED.movie_name,
      poster_url   = COALESCE(EXCLUDED.poster_url, watch_history.poster_url),
      thumb_url    = COALESCE(EXCLUDED.thumb_url, watch_history.thumb_url),
      server_slug  = EXCLUDED.server_slug,
      episode_name = EXCLUDED.episode_name,
      progress     = EXCLUDED.progress,
      duration     = EXCLUDED.duration,
      completed    = EXCLUDED.completed,
      updated_at   = EXCLUDED.updated_at
    WHERE watch_history.updated_at < EXCLUDED.updated_at
    RETURNING (xmax = 0) AS inserted`;

  const inserted = result.filter((r) => r.inserted).length;

  // Chỉ dọn phim cũ khi có dòng mới được thêm (1 câu DELETE duy nhất)
  if (inserted > 0) {
    await prisma.$executeRaw`
      DELETE FROM watch_history
      WHERE user_id = ${userId}
        AND movie_id IN (
          SELECT movie_id FROM watch_history
          WHERE user_id = ${userId}
          GROUP BY movie_id
          ORDER BY MAX(updated_at) DESC
          OFFSET ${Prisma.raw(String(MAX_MOVIES))}
        )`;
  }

  return { applied: result.length, inserted };
}

/* ---------- Handlers ---------- */

export async function GET() {
  const userId = await getUserId();
  if (!userId) return jsonBody({ data: [], authenticated: false });

  // Chỉ lấy cột client cần (bỏ id, userId)
  const history = await prisma.watchHistory.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: MAX_ROWS,
    select: {
      movieId: true,
      movieSlug: true,
      movieName: true,
      posterUrl: true,
      thumbUrl: true,
      episodeId: true,
      serverSlug: true,
      episodeName: true,
      progress: true,
      duration: true,
      completed: true,
      updatedAt: true,
    },
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

  const action = (body as { action?: unknown } | null)?.action;

  /* ----- clear ----- */
  if (action === "clear") {
    await prisma.watchHistory.deleteMany({ where: { userId } });
    return jsonBody({ success: true });
  }

  /* ----- remove ----- */
  if (action === "remove") {
    const parsed = removeSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    await prisma.watchHistory.deleteMany({
      where: {
        userId,
        movieId: parsed.data.movieId,
        ...(parsed.data.episodeId ? { episodeId: parsed.data.episodeId } : {}),
      },
    });
    return jsonBody({ success: true });
  }

  /* ----- bulk (gộp dữ liệu local sau đăng nhập, hoặc gom nhiều tập) ----- */
  if (action === "bulk") {
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const now = new Date();
    const rows = parsed.data.items
      .map((item) => toRow(item, now))
      .filter((r): r is Row => r !== null);

    const { applied } = await upsertRows(userId, rows);
    return jsonBody({ success: true, applied });
  }

  /* ----- save 1 tập ----- */
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const row = toRow(parsed.data, new Date());
  if (!row) return jsonBody({ success: true, skipped: true });

  const { applied } = await upsertRows(userId, [row]);
  return jsonBody({ success: true, applied: applied > 0 });
}