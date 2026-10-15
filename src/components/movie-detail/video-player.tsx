"use client";

import { useEffect, useRef, useState } from "react";
import type HlsType from "hls.js";
import { Clapperboard, Loader2, RotateCw, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Episode } from "@/types/movie-detail.types";
import { handleHlsError, cleanupHls } from "@/lib/hls-config";
import { useWatchHistoryStore } from "@/stores/watch-history-store";
import { getServerSlug } from "@/lib/movie-url";
import { setLiveSaver } from "@/lib/watch-history-sync";

interface VideoPlayerProps {
  episode: Episode;
  serverName: string;
  movieId: string;
  movieSlug: string;
  movieName: string;
  posterUrl?: string;
  thumbUrl?: string;
  /** Tổng số tập của phim (từ dữ liệu chi tiết phim). null/undefined nếu không biết */
  totalEpisodes?: number | null;
}

type Status = "loading" | "ready" | "error";

const LOCAL_SAVE_INTERVAL_MS = 15_000; // lưu localStorage tối đa mỗi 15s khi đang xem
const PAUSE_PUSH_DELAY_MS = 5_000; // pause quá 30s mới đẩy (đi vắng thật), tránh đánh thức DB vô ích
const PAUSE_PUSH_MIN_GAP_MS = 5 * 60_000; // 2 lần đẩy do pause cách nhau tối thiểu 5 phút
const MIN_RESUME_SECONDS = 30;
const MIN_REMAINING_SECONDS = 90;

export function VideoPlayer({
  episode,
  serverName,
  movieId,
  movieSlug,
  movieName,
  posterUrl,
  thumbUrl,
  totalEpisodes,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [attempt, setAttempt] = useState(0);

  // Giữ meta mới nhất mà KHÔNG làm effect chạy lại (tránh destroy HLS / giật video)
  const metaRef = useRef({
    movieId,
    movieSlug,
    movieName,
    posterUrl,
    thumbUrl,
    totalEpisodes: totalEpisodes ?? null,
    episodeId: episode.slug,
    episodeName: episode.name,
    serverSlug: getServerSlug(serverName),
  });
  metaRef.current = {
    movieId,
    movieSlug,
    movieName,
    posterUrl,
    thumbUrl,
    totalEpisodes: totalEpisodes ?? null,
    episodeId: episode.slug,
    episodeName: episode.name,
    serverSlug: getServerSlug(serverName),
  };

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
    const store = useWatchHistoryStore;

    // Snapshot meta của ĐÚNG tập này. Không đọc metaRef.current trong cleanup,
    // vì lúc đó ref đã bị gán sang tập mới.
    const meta = { ...metaRef.current };

    setStatus("loading");

    const fail = (msg: string) => {
      if (!active) return;
      setErrorMsg(msg);
      setStatus("error");
    };

    // ---------- Resume ----------
    // Mỗi phim chỉ nhớ tiến độ của TẬP ĐANG XEM (current). Tập xong có progress = 0 nên không seek.
    const seekToSaved = () => {
      if (!active) return;
      const saved = store.getState().movies[meta.movieId]?.current;
      if (!saved || saved.episodeId !== meta.episodeId) return;
      if (saved.progress < MIN_RESUME_SECONDS) return;
      if (video.duration - saved.progress <= MIN_REMAINING_SECONDS) return;
      video.currentTime = saved.progress;
    };

    video.addEventListener(
      "loadedmetadata",
      () => {
        if (!active) return;
        setStatus("ready");
        if (store.persist.hasHydrated()) {
          seekToSaved();
        } else {
          const unsub = store.persist.onFinishHydration(() => {
            unsub();
            seekToSaved();
          });
        }
      },
      { once: true, signal },
    );

    // ---------- Save (CHỈ localStorage, không gọi mạng) ----------
    // timeupdate: tối đa 15s/lần. pause / ended / ẩn tab / đóng tab / đổi tập: lưu ngay.
    let lastSavedAt = 0;
    const save = (force = false) => {
      if (!store.persist.hasHydrated()) return;
      if (!video.duration || !Number.isFinite(video.duration)) return;

      const now = Date.now();
      if (!force && now - lastSavedAt < LOCAL_SAVE_INTERVAL_MS) return;
      lastSavedAt = now;

      store.getState().saveProgress({
        ...meta,
        progress: video.currentTime,
        duration: video.duration,
      });
    };

    const pushNow = (minGapMs = 0) =>
      void store.getState().pushDirty({ minGapMs });

    video.addEventListener("timeupdate", () => save(), { signal });

    // pause: lưu local ngay; đẩy server sau PAUSE_PUSH_DELAY_MS nếu user KHÔNG bấm play lại.
    let pauseTimer: ReturnType<typeof setTimeout> | null = null;
    const cancelPauseTimer = () => {
      if (pauseTimer) clearTimeout(pauseTimer);
      pauseTimer = null;
    };

    video.addEventListener(
      "pause",
      () => {
        save(true);
        cancelPauseTimer();
        pauseTimer = setTimeout(() => {
          pauseTimer = null;
          pushNow(PAUSE_PUSH_MIN_GAP_MS);
        }, PAUSE_PUSH_DELAY_MS);
      },
      { signal },
    );
    video.addEventListener("play", cancelPauseTimer, { signal });
    // ended: currentTime ~ duration nên store sẽ thêm tập vào completedEpisodeIds
    video.addEventListener(
      "ended",
      () => {
        cancelPauseTimer();
        save(true);
        pushNow();
      },
      { signal },
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.visibilityState === "hidden") save(true);
      },
      { signal },
    );
    window.addEventListener("pagehide", () => save(true), { signal });

    setLiveSaver(() => save(true));

    // ---------- HLS ----------
    const init = async () => {
      const { default: Hls } = await import("hls.js");
      if (!active) return;

      if (Hls.isSupported()) {
        hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.3,
          backBufferLength: 30,
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
      cancelPauseTimer();
      save(true); // đổi tập / unmount vẫn lưu
      pushNow(); // rời tập này: đẩy phần thay đổi (nếu có)
      setLiveSaver(null);
      active = false;
      ac.abort();
      cleanupHls(hls);
      hls = null;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
    // Chỉ chạy lại khi đổi nguồn phát / bấm thử lại. Meta đọc qua metaRef.
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