"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, Clapperboard, Sparkles } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchResults } from "./search-results";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchSheetProps {
  children?: React.ReactNode;
}

export function SearchSheet({ children }: SearchSheetProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 500);
  const hasQuery = debouncedQuery.trim().length >= 1;

  // Focus input khi mở Sheet
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => clearTimeout(timer);
  }, [open]);

  // Xử lý đóng Sheet
  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      setQuery("");
    }
  };

  // Xóa nội dung tìm kiếm
  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" size="icon">
            <Search className="size-5" />
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        side="left"
        className="
          w-screen! max-w-none! sm:max-w-none!
          h-dvh p-0 gap-0 border-0
          bg-background
          [&>button]:hidden
        "
      >
        <div className="flex h-full flex-col overflow-hidden">
          <SheetHeader
            className="
              shrink-0 border-b
              px-5 py-4 sm:px-8 sm:py-6

              [@media(orientation:landscape)_and_(max-height:500px)]:px-4
              [@media(orientation:landscape)_and_(max-height:500px)]:py-2
            "
          >
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex size-11 items-center justify-center
                    rounded-xl bg-primary/10 text-primary

                    [@media(orientation:landscape)_and_(max-height:500px)]:size-9
                  "
                >
                  <Clapperboard className="size-5" />
                </div>

                <div className="space-y-1">
                  <SheetTitle className="text-lg font-bold sm:text-xl">
                    Tìm kiếm phim
                  </SheetTitle>

                  <SheetDescription
                    className="
                      text-xs sm:text-sm

                      [@media(orientation:landscape)_and_(max-height:500px)]:hidden
                    "
                  >
                    Khám phá bộ phim yêu thích của bạn
                  </SheetDescription>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenChange(false)}
                aria-label="Đóng tìm kiếm"
                className="size-10 rounded-full hover:bg-muted"
              >
                <X className="size-5" />
              </Button>
            </div>
          </SheetHeader>

          {/* Main */}
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Search Input */}
            <div
              className="
                w-full shrink-0
                px-5 pt-6 sm:px-8 sm:pt-8

                [@media(orientation:landscape)_and_(max-height:500px)]:px-4
                [@media(orientation:landscape)_and_(max-height:500px)]:pt-3
              "
            >
              <div className="">
                <div className="relative group">
                  <Search
                    className="
                      absolute left-4 top-1/2 size-5
                      -translate-y-1/2
                      text-muted-foreground
                      transition-colors
                      group-focus-within:text-primary
                    "
                  />

                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Nhập tên phim bạn muốn tìm..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="
                      h-14 rounded-xl border-2
                      border-border bg-muted/40
                      pl-12 pr-12 text-base
                      shadow-none transition-all
                      focus-visible:border-primary
                      focus-visible:bg-background
                      focus-visible:ring-4
                      focus-visible:ring-primary/10

                      [@media(orientation:landscape)_and_(max-height:500px)]:h-11
                      [@media(orientation:landscape)_and_(max-height:500px)]:text-sm
                    "
                  />

                  {query && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={clearSearch}
                      aria-label="Xóa nội dung tìm kiếm"
                      className="
                        absolute right-2 top-1/2
                        size-9 -translate-y-1/2
                        rounded-full text-muted-foreground
                        hover:text-foreground
                      "
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Search Results / Empty State */}
            <div className="min-h-0 flex-1 overflow-hidden">
              {hasQuery ? (
                <div
                  className="
                    h-full overflow-y-auto
                    px-5 pb-8 pt-5 sm:px-8
                  "
                >
                  <div className="mx-auto w-full max-w-5xl">
                    <SearchResults
                      query={debouncedQuery}
                      onClose={() => handleOpenChange(false)}
                      isMobile={true}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="
                    flex h-full flex-col
                    items-center justify-center
                    px-6 pb-12 text-center

                    [@media(orientation:landscape)_and_(max-height:500px)]:flex-row
                    [@media(orientation:landscape)_and_(max-height:500px)]:gap-5
                    [@media(orientation:landscape)_and_(max-height:500px)]:px-4
                    [@media(orientation:landscape)_and_(max-height:500px)]:pb-2
                  "
                >
                  {/* Empty State Icon */}
                  <div
                    className="
                      relative mb-7

                      [@media(orientation:landscape)_and_(max-height:500px)]:mb-0
                      [@media(orientation:landscape)_and_(max-height:500px)]:shrink-0
                    "
                  >
                    <div
                      className="
                        flex size-24 items-center justify-center
                        rounded-3xl border border-border
                        bg-muted/50

                        [@media(orientation:landscape)_and_(max-height:500px)]:size-16
                        [@media(orientation:landscape)_and_(max-height:500px)]:rounded-2xl
                      "
                    >
                      <Search
                        className="
                          size-10 text-muted-foreground/60

                          [@media(orientation:landscape)_and_(max-height:500px)]:size-7
                        "
                      />
                    </div>

                    <div
                      className="
                        absolute -right-3 -top-3
                        flex size-9 items-center
                        justify-center rounded-full
                        border bg-background shadow-sm

                        [@media(orientation:landscape)_and_(max-height:500px)]:hidden
                      "
                    >
                      <Sparkles className="size-4 text-primary" />
                    </div>
                  </div>

                  {/* Empty State Content */}
                  <div
                    className="
                      flex flex-col items-center

                      [@media(orientation:landscape)_and_(max-height:500px)]:items-start
                      [@media(orientation:landscape)_and_(max-height:500px)]:text-left
                    "
                  >
                    <h3
                      className="
                        mb-2 text-xl font-bold

                        [@media(orientation:landscape)_and_(max-height:500px)]:mb-1
                        [@media(orientation:landscape)_and_(max-height:500px)]:text-base
                      "
                    >
                      Bạn muốn xem phim gì?
                    </h3>

                    <p
                      className="
                        max-w-sm text-sm leading-relaxed
                        text-muted-foreground

                        [@media(orientation:landscape)_and_(max-height:500px)]:text-xs
                      "
                    >
                      Tìm kiếm tên phim để khám phá hàng nghìn bộ phim hấp dẫn
                      và bắt đầu hành trình giải trí của bạn.
                    </p>

                    <div
                      className="
                        mt-7 flex items-center gap-2
                        rounded-full border bg-muted/40
                        px-4 py-2 text-xs
                        text-muted-foreground

                        [@media(orientation:landscape)_and_(max-height:500px)]:hidden
                      "
                    >
                      <Sparkles className="size-3.5 text-primary" />
                      Khám phá thế giới điện ảnh
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </SheetContent>
    </Sheet>
  );
}
