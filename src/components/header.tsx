"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Film, Menu } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  showSidebar?: boolean;
  onMenuClick?: () => void;
}

export function Header({ showSidebar = false, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          {showSidebar && (
            <Button variant="ghost" size="icon" onClick={onMenuClick}>
              <Menu className="h-4 w-4" />
            </Button>
          )}
          <Link href="/" className="flex items-center space-x-2">
            <Film className="h-6 w-6" />
            <span className="font-bold">Qtiful</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-foreground/80">
            Trang chủ
          </Link>
          <Link
            href="/phim-moi"
            className="transition-colors hover:text-foreground/80"
          >
            Phim mới
          </Link>
          <Link
            href="/phim-le"
            className="transition-colors hover:text-foreground/80"
          >
            Phim lẻ
          </Link>
          <Link
            href="/phim-bo"
            className="transition-colors hover:text-foreground/80"
          >
            Phim bộ
          </Link>
          <Link
            href="/the-loai"
            className="transition-colors hover:text-foreground/80"
          >
            Thể loại
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
