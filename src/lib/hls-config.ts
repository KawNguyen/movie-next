import Hls from "hls.js";

/**
 * Cấu hình tối ưu cho HLS.js để giảm thiểu lỗi buffer
 * Dựa trên best practices từ các streaming platform lớn
 */
export const getOptimizedHlsConfig = (): Partial<Hls.Config> => {
  return {
    // Buffer configuration - giảm thiểu memory usage
    maxBufferLength: 10, // 10 seconds forward buffer (giảm từ 30s)
    maxMaxBufferLength: 20, // Maximum allowed buffer length
    maxBufferSize: 60 * 1000 * 1000, // 60MB buffer size
    maxBufferHole: 0.3, // 300ms hole tolerance

    // Loading và retry configuration
    manifestLoadingMaxRetry: 3,
    manifestLoadingRetryDelay: 500,
    levelLoadingMaxRetry: 3,
    levelLoadingRetryDelay: 500,
    fragLoadingMaxRetry: 3,
    fragLoadingRetryDelay: 500,

    // Startup performance
    startLevel: -1, // Auto start level
    capLevelToPlayerSize: true, // Limit resolution to player size

    // Error recovery
    enableWorker: true, // Use web worker if available

    // Network optimization
    enableSoftwareAES: true,

    // Fragment loading
    fragLoadingTimeOut: 20000, // 20s timeout
    manifestLoadingTimeOut: 10000, // 10s timeout

    // Live stream specific (tắt vì chúng ta stream video files)
    liveBackBufferLength: 5,
  };
};

/**
 * Error recovery strategies cho các loại lỗi HLS phổ biến
 */
export const handleHlsError = (
  hls: Hls,
  data: { fatal: boolean; type: string; details?: string },
): boolean => {
  if (!data.fatal) {
    // Non-fatal errors - log và continue
    console.warn("HLS non-fatal error:", data);
    return false;
  }

  switch (data.type) {
    case Hls.ErrorTypes.NETWORK_ERROR:
      console.warn("HLS network error, attempting recovery...");
      try {
        hls.startLoad();
        return true;
      } catch (e) {
        console.error("Failed to recover from network error:", e);
        return false;
      }

    case Hls.ErrorTypes.MEDIA_ERROR:
      console.warn("HLS media error, attempting recovery...");
      try {
        hls.recoverMediaError();
        return true;
      } catch (e) {
        console.error("Failed to recover from media error:", e);
        // Fallback: try to swap audio codec
        try {
          hls.swapAudioCodec();
          hls.recoverMediaError();
          return true;
        } catch (fallbackError) {
          console.error("Fallback recovery failed:", fallbackError);
          return false;
        }
      }

    case Hls.ErrorTypes.KEY_SYSTEM_ERROR:
      console.error("HLS DRM error - không thể khôi phục:", data);
      return false;

    default:
      console.error("HLS fatal error:", data);
      return false;
  }
};

/**
 * Cleanup HLS instance một cách an toàn
 */
export const cleanupHls = (hls: Hls | null): void => {
  if (!hls) return;

  try {
    // Stop loading trước
    if (hls.media) {
      hls.stopLoad();
    }

    // Destroy instance
    hls.destroy();
  } catch (e) {
    console.warn("Error during HLS cleanup:", e);
  }
};
