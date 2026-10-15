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
const MAX_COMPLETED = 2000; // số tập hoàn thành tối đa mỗi phim
const MAX_BULK_ITEMS = 100;
const MAX_FUTURE_MS = 5 * 60 * 1000;
const MIN_SAVE_SECONDS = 30;

/* ---------- Validation ---------- */

const id = z.string().trim().min(1).max(200);

const itemSchema = z.object({
  movieId: id,
  movieSlug: id,
  movieName: z.string().trim().min(1).max(300),
  posterUrl: z.string().max(2000).optional().nullable(),
  thumbUrl: z.string().max(2000).optional().nullable(),
  totalEpisodes: z.number().int().min(0).max(100000).optional().nullable(),
  episodeId: id,
  episodeName: z.string().trim().min(1).max(300),
  serverSlug: id,
  progress: z.number().min(0).max(86400),
  duration: z.number().positive().max(86400),
  completedEpisodes: z.array(id).max(MAX_COMPLETED).default([]),
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
  totalEpisodes: number | null;
  episodeId: string;
  episodeName: string;
  serverSlug: string;
  progress: number;
  duration: number;
  completedEpisodes: string[];
  updatedAt: Date;
}

/** Chuẩn hóa 1 item từ client; trả null nếu không có gì đáng lưu */
function toRow(input: z.infer<typeof itemSchema>, now: Date): Row | null {
  const duration = Math.floor(input.duration);
  const progress = Math.min(Math.floor(input.progress), duration);
  const completedEpisodes = [...new Set(input.completedEpisodes)];

  // Chưa xem tới ngưỡng và cũng chưa có tập nào hoàn thành -> bỏ qua
  if (progress < MIN_SAVE_SECONDS && completedEpisodes.length === 0) return null;

  const requested = input.updatedAt ? new Date(input.updatedAt) : now;
  const updatedAt =
    requested.getTime() > now.getTime() + MAX_FUTURE_MS ? now : requested;

  return {
    movieId: input.movieId,
    movieSlug: input.movieSlug,
    movieName: input.movieName,
    posterUrl: input.posterUrl || null,
    thumbUrl: input.thumbUrl || null,
    totalEpisodes: input.totalEpisodes ?? null,
    episodeId: input.episodeId,
    episodeName: input.episodeName,
    serverSlug: input.serverSlug,
    progress,
    duration,
    completedEpisodes,
    updatedAt,
  };
}

/** Gộp 2 dòng cùng phim: phần "đang xem" lấy bản mới hơn, tập hoàn thành là union */
function mergeRows(a: Row, b: Row): Row {
  const [newer, older] = b.updatedAt > a.updatedAt ? [b, a] : [a, b];
  return {
    ...newer,
    posterUrl: newer.posterUrl ?? older.posterUrl,
    thumbUrl: newer.thumbUrl ?? older.thumbUrl,
    totalEpisodes: newer.totalEpisodes ?? older.totalEpisodes,
    completedEpisodes: [
      ...new Set([...older.completedEpisodes, ...newer.completedEpisodes]),
    ],
  };
}

/**
 * Ghi N phim bằng ĐÚNG 1 câu SQL (INSERT ... ON CONFLICT DO UPDATE).
 * - completed_episodes: luôn UNION (không bao giờ mất tập đã xem dù request đến sai thứ tự).
 * - Phần "đang xem" (episode, progress, duration, tên...): bản updatedAt mới hơn thắng.
 * - Tất cả vế phải trong SET đều đọc giá trị CŨ của dòng, nên updated_at = GREATEST(...) ở cuối an toàn.
 */
async function upsertRows(userId: string, rows: Row[]) {
  const byMovie = new Map<string, Row>();
  for (const r of rows) {
    const cur = byMovie.get(r.movieId);
    byMovie.set(r.movieId, cur ? mergeRows(cur, r) : r);
  }
  const unique = [...byMovie.values()];
  if (unique.length === 0) return { applied: 0, inserted: 0 };

  const values = unique.map(
    (r) =>
      Prisma.sql`(${randomUUID()}, ${userId}, ${r.movieId}, ${r.movieSlug}, ${r.movieName}, ${r.posterUrl}, ${r.thumbUrl}, ${r.totalEpisodes}::int, ${r.episodeId}, ${r.episodeName}, ${r.serverSlug}, ${r.progress}, ${r.duration}, ${r.completedEpisodes}::text[], (${r.updatedAt.toISOString()}::timestamptz AT TIME ZONE 'UTC'))`,
  );

  const newer = Prisma.raw("EXCLUDED.updated_at > watch_history.updated_at");

  const result = await prisma.$queryRaw<{ inserted: boolean }[]>`
    INSERT INTO watch_history
      (id, user_id, movie_id, movie_slug, movie_name, poster_url, thumb_url,
       total_episodes, episode_id, episode_name, server_slug, progress, duration,
       completed_episodes, updated_at)
    VALUES ${Prisma.join(values)}
    ON CONFLICT (user_id, movie_id) DO UPDATE SET
      completed_episodes = ARRAY(
        SELECT DISTINCT e FROM unnest(watch_history.completed_episodes || EXCLUDED.completed_episodes) AS e
      ),
      total_episodes = COALESCE(EXCLUDED.total_episodes, watch_history.total_episodes),
      poster_url     = COALESCE(EXCLUDED.poster_url, watch_history.poster_url),
      thumb_url      = COALESCE(EXCLUDED.thumb_url, watch_history.thumb_url),
      movie_slug     = CASE WHEN ${newer} THEN EXCLUDED.movie_slug   ELSE watch_history.movie_slug   END,
      movie_name     = CASE WHEN ${newer} THEN EXCLUDED.movie_name   ELSE watch_history.movie_name   END,
      episode_id     = CASE WHEN ${newer} THEN EXCLUDED.episode_id   ELSE watch_history.episode_id   END,
      episode_name   = CASE WHEN ${newer} THEN EXCLUDED.episode_name ELSE watch_history.episode_name END,
      server_slug    = CASE WHEN ${newer} THEN EXCLUDED.server_slug  ELSE watch_history.server_slug  END,
      progress       = CASE WHEN ${newer} THEN EXCLUDED.progress     ELSE watch_history.progress     END,
      duration       = CASE WHEN ${newer} THEN EXCLUDED.duration     ELSE watch_history.duration     END,
      updated_at     = GREATEST(watch_history.updated_at, EXCLUDED.updated_at)
    RETURNING (xmax = 0) AS inserted`;

  const inserted = result.filter((r) => r.inserted).length;

  // Mỗi phim 1 dòng -> dọn phim cũ nhất khi có dòng mới được thêm
  if (inserted > 0) {
    await prisma.$executeRaw`
      DELETE FROM watch_history
      WHERE id IN (
        SELECT id FROM watch_history
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
        OFFSET ${MAX_MOVIES}
      )`;
  }

  return { applied: result.length, inserted };
}

/* ---------- Handlers ---------- */

export async function GET() {
  const userId = await getUserId();
  if (!userId) return jsonBody({ data: [], authenticated: false });

  const history = await prisma.watchHistory.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: MAX_MOVIES,
    select: {
      movieId: true,
      movieSlug: true,
      movieName: true,
      posterUrl: true,
      thumbUrl: true,
      totalEpisodes: true,
      episodeId: true,
      episodeName: true,
      serverSlug: true,
      progress: true,
      duration: true,
      completedEpisodes: true,
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
    const { movieId, episodeId } = parsed.data;

    if (!episodeId) {
      // Xóa cả phim
      await prisma.watchHistory.deleteMany({ where: { userId, movieId } });
    } else {
      // Bỏ 1 tập khỏi danh sách hoàn thành; nếu đó là tập đang xem thì đưa progress về 0.
      // Nếu không còn gì để giữ thì xóa luôn dòng.
      await prisma.$executeRaw`
        UPDATE watch_history
        SET completed_episodes = array_remove(completed_episodes, ${episodeId}),
            progress = CASE WHEN episode_id = ${episodeId} THEN 0 ELSE progress END
        WHERE user_id = ${userId} AND movie_id = ${movieId}`;
      await prisma.$executeRaw`
        DELETE FROM watch_history
        WHERE user_id = ${userId} AND movie_id = ${movieId}
          AND episode_id = ${episodeId}
          AND cardinality(completed_episodes) = 0`;
    }
    return jsonBody({ success: true });
  }

  /* ----- bulk ----- */
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

  /* ----- save 1 phim ----- */
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const row = toRow(parsed.data, new Date());
  if (!row) return jsonBody({ success: true, skipped: true });

  const { applied } = await upsertRows(userId, [row]);
  return jsonBody({ success: true, applied: applied > 0 });
}