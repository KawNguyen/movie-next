"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PanelLeftIcon } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const SIZE = 48; // kích thước nút (px)
const MARGIN = 8; // khoảng cách tối thiểu tới mép màn hình
const SHOW_AFTER = 80; // cuộn quá bao nhiêu px thì hiện nút
const DRAG_THRESHOLD = 5; // di chuyển quá ngưỡng này mới tính là kéo
const STORAGE_KEY = "floating-sidebar-btn-pos";

type Pos = { x: number; y: number };

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

function clampPos({ x, y }: Pos): Pos {
  return {
    x: clamp(x, MARGIN, window.innerWidth - SIZE - MARGIN),
    y: clamp(y, MARGIN, window.innerHeight - SIZE - MARGIN),
  };
}

export function FloatingSidebarButton() {
  const { toggleSidebar, state, isMobile, openMobile } = useSidebar();
  const [scrolled, setScrolled] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);

  const drag = useRef({
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  });

  // Khởi tạo vị trí (chỉ chạy ở client)
  useEffect(() => {
    let initial: Pos = { x: MARGIN, y: window.innerHeight / 2 };
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) initial = JSON.parse(saved);
    } catch {}
    setPos(clampPos(initial));
  }, []);

  // Giữ nút trong màn hình khi resize
  useEffect(() => {
    const onResize = () => setPos((p) => (p ? clampPos(p) : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Hiện nút khi cuộn xuống
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!pos) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: pos.x,
        originY: pos.y,
        moved: false,
      };
      setDragging(true);
    },
    [pos],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragging) return;
      const d = drag.current;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      d.moved = true;
      setPos(clampPos({ x: d.originX + dx, y: d.originY + dy }));
    },
    [dragging],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDragging(false);

      // Chỉ click, không kéo -> mở sidebar
      if (!drag.current.moved) {
        toggleSidebar();
        return;
      }

      // Kéo xong -> hít vào mép trái/phải gần nhất rồi lưu vị trí
      setPos((p) => {
        if (!p) return p;
        const snapped = clampPos({
          x:
            p.x + SIZE / 2 < window.innerWidth / 2
              ? MARGIN
              : window.innerWidth - SIZE - MARGIN,
          y: p.y,
        });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(snapped));
        } catch {}
        return snapped;
      });
    },
    [toggleSidebar],
  );

  const isOpen = isMobile ? openMobile : state === "expanded";
  const visible = scrolled && pos !== null;

  if (!pos) return null;

  return (
    <button
      type="button"
      aria-label="Mở sidebar"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        left: pos.x,
        top: pos.y,
        width: SIZE,
        height: SIZE,
        touchAction: "none", // bắt buộc để kéo mượt trên mobile
      }}
      className={cn(
        "fixed z-50 flex items-center justify-center rounded-full",
        "border bg-background/90 text-foreground shadow-lg backdrop-blur",
        "select-none cursor-grab active:cursor-grabbing",
        // chỉ animate khi hít vào mép, không animate lúc đang kéo
        !dragging && "transition-[left,top,opacity,transform] duration-200",
        visible
          ? "opacity-100 scale-100"
          : "pointer-events-none opacity-0 scale-75",
      )}
    >
      <PanelLeftIcon className="size-5" />
    </button>
  );
}