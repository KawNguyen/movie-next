"use client";

import { useEffect, useRef } from "react";

interface VideoElementWrapperProps {
  children: React.ReactNode;
  onCleanup?: () => void;
}

/**
 * Wrapper component để handle video element lifecycle
 * Đảm bảo cleanup proper khi component unmount
 */
export function VideoElementWrapper({
  children,
  onCleanup,
}: VideoElementWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isUnmountingRef = useRef(false);

  useEffect(() => {
    const wrapperElement = wrapperRef.current;

    return () => {
      isUnmountingRef.current = true;

      // Cleanup any video elements in the wrapper
      if (wrapperElement) {
        const videos = wrapperElement.querySelectorAll("video");
        videos.forEach((video) => {
          try {
            // Pause video and clear src
            video.pause();
            video.removeAttribute("src");
            video.load();
          } catch (e) {
            console.warn("Error cleaning up video element:", e);
          }
        });
      }

      // Call custom cleanup if provided
      if (onCleanup) {
        try {
          onCleanup();
        } catch (e) {
          console.warn("Error in custom cleanup:", e);
        }
      }
    };
  }, [onCleanup]);

  return (
    <div ref={wrapperRef} className="video-wrapper">
      {children}
    </div>
  );
}
