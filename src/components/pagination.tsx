"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import { useEffect, useState } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  loading = false,
}: PaginationProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 640);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const getPageNumbers = () => {
    const delta = isMobile ? 1 : 2; // 👈 mobile hiển thị ít số hơn
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    range.push(1);

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (totalPages > 1) {
      range.push(totalPages);
    }

    let l: number | undefined = undefined;
    for (const i of range) {
      if (l !== undefined) {
        if ((i as number) - l === 2) {
          rangeWithDots.push(l + 1);
        } else if ((i as number) - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i as number;
    }

    return rangeWithDots;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !loading) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-6">
      {/* Thông tin tổng số phim */}
      <div className="text-sm text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
        Hiển thị {startItem} - {endItem} trong tổng số{" "}
        {formatNumber(totalItems)} phim
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-1 order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1 || loading}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0"
          title="Trang đầu"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0"
          title="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <div key={index}>
              {page === "..." ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="h-9 w-9 p-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page as number)}
                  disabled={loading}
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-xs"
                  title={`Trang ${page}`}
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0"
          title="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages || loading}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0"
          title="Trang cuối"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
