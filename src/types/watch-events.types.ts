export type WatchEventType =
  | "START_WATCH"
  | "PROGRESS_UPDATE"
  | "COMPLETE_WATCH"
  | "PAUSE_WATCH"
  | "RESUME_WATCH";

export interface WatchEvent {
  type: WatchEventType;
  userId: string;
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl?: string;
  thumbUrl?: string; // ảnh thu nhỏ
  episodeId: string;
  episodeName: string;
  progress: number; // thời gian hiện tại (giây)
  duration: number; // tổng thời lượng video (giây)
  timestamp: Date;
  sessionId?: string; // để track session xem
}

export interface WatchSession {
  id: string;
  userId: string;
  movieId: string;
  episodeId: string;
  startedAt: Date;
  lastUpdatedAt: Date;
  isActive: boolean;
}

export type WatchStatus = "watching" | "completed" | "paused";

export interface WatchHistoryWithStatus {
  id: string;
  userId: string;
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl?: string;
  thumbUrl?: string;
  episodeId: string;
  episodeName: string;
  progress: number;
  duration: number;
  progressPercent: number; // progress / duration * 100
  status: WatchStatus;
  startedAt: Date;
  lastWatchedAt: Date;
  completedAt?: Date;
  sessionCount: number; // số lần xem
}
