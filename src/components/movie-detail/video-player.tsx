"use client";

import { useEffect, useRef, useState } from "react";
import type HlsType from "hls.js";
import { Clapperboard, Loader2, RotateCw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Episode } from "@/types/movie-detail.types";
import { useWatchEvents } from "@/hooks/use-watch-events";
import { handleHlsError, cleanupHls } from "@/lib/hls-config";

interface VideoPlayerProps {
  episode: Episode;
  serverName: string;
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl?: string;
  thumbUrl?: string;
}

type Status = "loading" | "ready" | "error";

const formatTime = (s: number) =>
  `${Math.floor(s / 60)}:${Math.floor(s % 60)
    .toString()
    .padStart(2, "0")}`;

export function VideoPlayer({
  episode,
  serverName,
  movieId,
  movieSlug,
  movieName,
  posterUrl,
  thumbUrl,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [attempt, setAttempt] = useState(0);

  const watch = useWatchEvents({
    movieId,
    movieSlug,
    movieName,
    posterUrl,
    thumbUrl,
    episodeId: episode.slug,
    episodeName: episode.name,
  });

  // Giữ handler mới nhất trong ref -> effect phát video KHÔNG phải chạy lại
  // (và khởi tạo lại HLS) mỗi khi hook trả về function mới.
  const watchRef = useRef(watch);
  useEffect(() => {
    watchRef.current = watch;
  });

  const src = episode.link_m3u8;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!src) {
      setErrorMsg("Không tìm thấy link video cho tập này.");
      setStatus("error");
      return;
    }

    let active = true;
    let hls: HlsType | null = null;
    const ac = new AbortController();
    const { signal } = ac;

    setStatus("loading");

    const fail = (msg: string) => {
      if (!active) return;
      setErrorMsg(msg);
      setStatus("error");
    };

    // Tải tiến độ đã lưu song song với việc tải manifest
    const progressPromise = watchRef.current
      .getSavedProgress()
      .catch(() => 0) as Promise<number>;

    video.addEventListener(
      "loadedmetadata",
      async () => {
        if (!active) return;
        setStatus("ready");
        const saved = await progressPromise;
        if (!active || !saved || saved < 3) return;
        if (video.duration && saved > video.duration - 5) return;
        video.currentTime = saved;
        toast.success(`Tiếp tục từ ${formatTime(saved)}`);
      },
      { once: true, signal },
    );

    // Ghi nhận tiến độ xem, giới hạn 1 lần/giây
    let lastReport = 0;
    video.addEventListener(
      "timeupdate",
      () => {
        const now = Date.now();
        if (now - lastReport < 1000 || !video.duration) return;
        lastReport = now;
        watchRef.current.handleProgressUpdate(
          video.currentTime,
          video.duration,
        );
      },
      { signal },
    );
    video.addEventListener(
      "play",
      () => {
        if (!video.duration) return;
        watchRef.current.handleStartWatch(video.currentTime, video.duration);
        watchRef.current.handleResumeWatch(video.currentTime, video.duration);
      },
      { signal },
    );
    video.addEventListener(
      "pause",
      () => {
        if (!video.duration) return;
        watchRef.current.handlePauseWatch(video.currentTime, video.duration);
      },
      { signal },
    );
    video.addEventListener(
      "ended",
      () => {
        if (!video.duration) return;
        watchRef.current.handleCompleteWatch(video.duration);
      },
      { signal },
    );

    const init = async () => {
      // hls.js khá nặng (~500KB) -> chỉ tải khi thật sự cần phát
      const { default: Hls } = await import("hls.js");
      if (!active) return;

      if (Hls.isSupported()) {
        hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.3,
          backBufferLength: 30, // giải phóng bộ nhớ phần đã xem
          startLevel: -1,
          capLevelToPlayerSize: true,
          enableWorker: true,
          manifestLoadingMaxRetry: 3,
          manifestLoadingRetryDelay: 500,
          manifestLoadingTimeOut: 10000,
          levelLoadingMaxRetry: 3,
          levelLoadingRetryDelay: 500,
          fragLoadingMaxRetry: 3,
          fragLoadingRetryDelay: 500,
          fragLoadingTimeOut: 20000,
        });
        const instance = hls;
        instance.on(Hls.Events.ERROR, (_e, data) => {
          if (!active) return;
          const recovered = handleHlsError(instance, data);
          if (!recovered && data.fatal) {
            fail("Không thể tải video. Vui lòng thử server khác.");
          }
        });
        instance.loadSource(src);
        instance.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.addEventListener(
          "error",
          () => fail("Không thể tải video. Vui lòng thử server khác."),
          { signal },
        );
        video.src = src;
      } else {
        fail("Trình duyệt không hỗ trợ phát video HLS.");
      }
    };

    init();

    return () => {
      active = false;
      ac.abort();
      cleanupHls(hls);
      hls = null;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, episode.slug, attempt]);

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Clapperboard className="size-5 shrink-0 text-primary" />
          <h2 className="truncate font-semibold">Đang xem: {episode.name}</h2>
        </div>
        <Badge variant="outline" className="shrink-0">
          {serverName}
        </Badge>
      </header>

      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          className="size-full"
          controls
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
          poster={posterUrl || thumbUrl}
        />

        {status === "loading" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-white">
            <Loader2 className="size-10 animate-spin opacity-70" />
            <p className="text-sm">Đang tải video…</p>
          </div>
        )}

        {status === "error" && (
          <div
            role="alert"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center text-white"
          >
            <TriangleAlert className="size-10 opacity-70" />
            <div>
              <p className="font-medium">Không phát được video</p>
              <p className="mt-1 text-sm text-white/70">{errorMsg}</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setAttempt((n) => n + 1)}
            >
              <RotateCw className="size-4" /> Thử lại
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
