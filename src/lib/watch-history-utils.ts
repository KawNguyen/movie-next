export const formatWatchTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const formatWatchProgress = (
  progress: number,
  duration: number
): string => {
  if (duration === 0) return "0%";
  const percent = Math.round((progress / duration) * 100);
  return `${Math.min(percent, 100)}%`;
};

export const getProgressPercent = (
  progress: number,
  duration: number
): number => {
  if (duration === 0) return 0;
  return Math.min((progress / duration) * 100, 100);
};

export const isWatchCompleted = (
  progress: number,
  duration: number
): boolean => {
  const percent = getProgressPercent(progress, duration);
  return percent >= 90; // Coi như hoàn thành nếu xem >= 90%
};

export const shouldShowInContinueWatching = (
  progress: number,
  duration: number
): boolean => {
  const percent = getProgressPercent(progress, duration);
  return percent > 5 && percent < 90; // Hiển thị nếu xem > 5% và < 90%
};

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "Vừa xem";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  } else {
    return date.toLocaleDateString("vi-VN");
  }
};
