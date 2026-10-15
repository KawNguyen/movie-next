ALTER TABLE "watch_history"
  ADD COLUMN "total_episodes" INTEGER,
  ADD COLUMN "completed_episodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
 
-- Gom các tập đã hoàn thành vào mọi dòng của cùng phim
UPDATE "watch_history" w
SET "completed_episodes" = d.eps
FROM (
  SELECT user_id, movie_id, array_agg(DISTINCT episode_id) AS eps
  FROM "watch_history"
  WHERE completed
  GROUP BY user_id, movie_id
) d
WHERE w.user_id = d.user_id AND w.movie_id = d.movie_id;
 
-- Chỉ giữ dòng mới nhất của mỗi (user, phim)
DELETE FROM "watch_history" w
USING (
  SELECT id,
         row_number() OVER (PARTITION BY user_id, movie_id ORDER BY updated_at DESC) AS rn
  FROM "watch_history"
) r
WHERE w.id = r.id AND r.rn > 1;
 
DROP INDEX "watch_history_user_id_movie_id_episode_id_key";
DROP INDEX "watch_history_user_id_updated_at_idx";
ALTER TABLE "watch_history" DROP COLUMN "completed";
ALTER TABLE "watch_history" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
 
CREATE UNIQUE INDEX "watch_history_user_id_movie_id_key" ON "watch_history"("user_id", "movie_id");
CREATE INDEX "watch_history_user_id_updated_at_idx" ON "watch_history"("user_id", "updated_at" DESC);
 