"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const TOUR_STORAGE_KEY = "qtiful-guided-tour-v2-disabled";
const SPOTLIGHT_PADDING = 6;
const CARD_GAP = 16;
const VIEWPORT_MARGIN = 16;

type Step = {
  target?: string;
  title: string;
  description: string;
  benefits?: string[];
};

const steps: Step[] = [
  {
    title: "Xin chào!",
    description:
      "Chào mừng bạn đến với Qtiful Movie. Hãy cùng xem nhanh các chức năng để có trải nghiệm xem phim thuận tiện hơn nhé!",
  },
  {
    target: "[data-tour='login']",
    title: "Đăng nhập để nhận nhiều lợi ích hơn",
    description:
      "Nhấn vào nút Đăng nhập ở cuối menu để mở khóa trải nghiệm xem phim cá nhân hóa.",
    benefits: [
      "Lưu và đồng bộ lịch sử xem để xem tiếp đúng nơi bạn đã dừng.",
      "Tạo danh sách phim yêu thích để tìm lại bất cứ lúc nào.",
      "Theo dõi nội dung của bạn thuận tiện trên nhiều thiết bị.",
    ],
  },
  {
    target: "[data-tour='sidebar']",
    title: "Menu điều hướng",
    description:
      "Mở menu này để xem phim mới, thể loại, quốc gia, lịch sử xem và danh sách phim yêu thích.",
  },
  {
    target: "[data-tour='search']",
    title: "Tìm kiếm phim",
    description:
      "Nhập tên phim bạn muốn xem để tìm nhanh trong kho phim của Qtiful.",
  },
  {
    target: "[data-tour='movie-list']",
    title: "Khám phá phim",
    description:
      "Chọn một bộ phim để xem chi tiết, theo dõi các tập và thêm vào danh sách yêu thích.",
  },
  {
    target: "[data-tour='theme']",
    title: "Chọn giao diện",
    description:
      "Bạn có thể chuyển đổi giao diện sáng hoặc tối để xem phim thoải mái hơn.",
  },
];

type Rect = { top: number; left: number; width: number; height: number };
type Position = { top: number; left: number } | null;

export function GuidedTour() {
  const [stepIndex, setStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [visible, setVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [cardPosition, setCardPosition] = useState<Position>(null);
  const [cardSize, setCardSize] = useState({ w: 0, h: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const progress = ((stepIndex + 1) / steps.length) * 100;

  useEffect(() => {
    try {
      if (localStorage.getItem(TOUR_STORAGE_KEY) !== "true") {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  // Theo dõi vị trí phần tử được highlight
  useEffect(() => {
    if (!visible || !step.target) {
      setTargetRect(null);
      return;
    }

    const updateTarget = () => {
      const element = document.querySelector(step.target!);
      if (!element) {
        setTargetRect(null);
        return;
      }
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    document
      .querySelector(step.target)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    updateTarget();
    // Đo lại sau khi scroll/animation của sidebar kết thúc
    const timeout = window.setTimeout(updateTarget, 350);

    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, { passive: true });

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget);
    };
  }, [step.target, visible]);

  // Theo dõi kích thước thẻ để tính vị trí đúng
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!visible || !card) return;

    const update = () =>
      setCardSize({ w: card.offsetWidth, h: card.offsetHeight });
    update();

    const observer = new ResizeObserver(update);
    observer.observe(card);
    return () => observer.disconnect();
  }, [visible]);

  // Đặt thẻ hướng dẫn cạnh phần tử được highlight (hoặc giữa màn hình)
  useLayoutEffect(() => {
    if (!visible) return;

    const isMobile = window.innerWidth < 640;
    const { w: cardW, h: cardH } = cardSize;

    if (!targetRect || isMobile || !cardW || !cardH) {
      setCardPosition(null);
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const clamp = (value: number, min: number, max: number) =>
      Math.max(min, Math.min(value, max));

    const gap = CARD_GAP + SPOTLIGHT_PADDING;
    const spaceBelow = vh - (targetRect.top + targetRect.height);
    const spaceAbove = targetRect.top;
    const spaceRight = vw - (targetRect.left + targetRect.width);
    const spaceLeft = targetRect.left;

    const placeBelow = () => ({
      top: targetRect.top + targetRect.height + gap,
      left: targetRect.left + targetRect.width / 2 - cardW / 2,
    });
    const placeAbove = () => ({
      top: targetRect.top - cardH - gap,
      left: targetRect.left + targetRect.width / 2 - cardW / 2,
    });
    const placeRight = () => ({
      top: targetRect.top + targetRect.height / 2 - cardH / 2,
      left: targetRect.left + targetRect.width + gap,
    });
    const placeLeft = () => ({
      top: targetRect.top + targetRect.height / 2 - cardH / 2,
      left: targetRect.left - cardW - gap,
    });

    // Target nằm ở cột trái (sidebar) thì ưu tiên đặt thẻ bên phải
    const targetInLeftColumn =
      targetRect.left + targetRect.width / 2 < vw / 3;

    let pos: { top: number; left: number } | null = null;

    if (targetInLeftColumn && spaceRight >= cardW + gap) pos = placeRight();
    else if (spaceBelow >= cardH + gap) pos = placeBelow();
    else if (spaceAbove >= cardH + gap) pos = placeAbove();
    else if (spaceRight >= cardW + gap) pos = placeRight();
    else if (spaceLeft >= cardW + gap) pos = placeLeft();

    if (!pos) {
      setCardPosition(null);
      return;
    }

    setCardPosition({
      top: clamp(pos.top, VIEWPORT_MARGIN, vh - cardH - VIEWPORT_MARGIN),
      left: clamp(pos.left, VIEWPORT_MARGIN, vw - cardW - VIEWPORT_MARGIN),
    });
  }, [targetRect, cardSize, visible]);

  // Phím tắt: Esc để đóng, mũi tên để chuyển bước
  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTour();
      if (event.key === "ArrowRight") nextStep();
      if (event.key === "ArrowLeft") setStepIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, stepIndex, dontShowAgain]);

  const closeTour = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(TOUR_STORAGE_KEY, "true");
      } catch {
        // Bỏ qua nếu trình duyệt chặn localStorage
      }
    }
    setVisible(false);
  };

  const nextStep = () => {
    if (isLastStep) {
      closeTour();
      return;
    }
    setStepIndex((current) => current + 1);
  };

  if (!visible) return null;

  const isCentered = !cardPosition;

  return (
    <div className="fixed inset-0 z-100">
      {/* Có target: khoét lỗ bằng box-shadow. Không có target: phủ tối toàn màn hình. */}
      {targetRect ? (
        <div
          className="pointer-events-none absolute rounded-lg ring-2 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] transition-all duration-300"
          style={{
            top: targetRect.top - SPOTLIGHT_PADDING,
            left: targetRect.left - SPOTLIGHT_PADDING,
            width: targetRect.width + SPOTLIGHT_PADDING * 2,
            height: targetRect.height + SPOTLIGHT_PADDING * 2,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
      )}

      <Card
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label="Hướng dẫn sử dụng Qtiful Movie"
        className={
          isCentered
            ? "absolute left-1/2 top-1/2 w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 gap-0 py-0 shadow-2xl"
            : "absolute w-[min(24rem,calc(100vw-2rem))] gap-0 py-0 shadow-2xl transition-[top,left] duration-300"
        }
        style={
          isCentered
            ? undefined
            : { top: cardPosition.top, left: cardPosition.left }
        }
      >
        <CardHeader className="relative gap-3 px-5 pt-5 pb-0">
          <div className="flex items-center justify-between pr-8">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="size-3" />
              Hướng dẫn {stepIndex + 1}/{steps.length}
            </Badge>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={closeTour}
            aria-label="Đóng hướng dẫn"
            className="absolute right-3 top-3 size-7 text-muted-foreground"
          >
            <X className="size-4" />
          </Button>
          <Progress value={progress} className="h-1" />
          <h2 className="text-xl font-semibold leading-tight tracking-tight">
            {step.title}
          </h2>
        </CardHeader>

        <CardContent className="px-5 pt-3">
          <p className="text-sm leading-6 text-muted-foreground">
            {step.description}
          </p>

          {step.benefits && (
            <ul className="mt-4 space-y-2.5 rounded-lg border bg-muted/40 p-3 text-sm">
              {step.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                  <span className="leading-5">{benefit}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 flex items-center gap-2">
            <Checkbox
              id="tour-dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <Label
              htmlFor="tour-dont-show-again"
              className="cursor-pointer text-sm font-normal text-muted-foreground"
            >
              Không hiển thị lại
            </Label>
          </div>
        </CardContent>

        <Separator className="mt-4" />

        <CardFooter className="flex items-center justify-between px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={closeTour}
            className="text-muted-foreground"
          >
            Bỏ qua
          </Button>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStepIndex((current) => current - 1)}
              >
                <ArrowLeft className="size-4" />
                Trước
              </Button>
            )}
            <Button type="button" size="sm" onClick={nextStep}>
              {isLastStep ? (
                <>
                  <Check className="size-4" />
                  Hoàn tất
                </>
              ) : (
                <>
                  Tiếp tục
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}