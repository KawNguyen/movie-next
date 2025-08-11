"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
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

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const clearSearch = () => {
    setQuery("");
  };

  const handleClose = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" size="icon" className="gap-2">
            <Search className="h-5 w-5" />
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-full h-screen rounded-t-2xl p-0 overflow-hidden border-t-2"
      >
        <SheetHeader className="p-6 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-semibold">
              Tìm kiếm phim
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <SheetDescription className="sr-only">
            Tìm kiếm phim yêu thích của bạn
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 py-4 space-y-4 h-full flex flex-col">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Nhập tên phim để tìm kiếm..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 pr-12 h-14 text-base rounded-2xl border-2 focus:border-primary transition-colors"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            {debouncedQuery.trim().length >= 1 ? (
              <div className="h-full overflow-y-auto -mx-6 px-6">
                <SearchResults
                  query={debouncedQuery}
                  onClose={handleClose}
                  isMobile={true}
                />
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Search className="h-16 w-16 mx-auto mb-6 text-muted-foreground/30" />
                <h3 className="text-xl font-medium mb-3">Tìm kiếm phim</h3>
                <p className="text-base">Nhập tên phim để bắt đầu tìm kiếm</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
