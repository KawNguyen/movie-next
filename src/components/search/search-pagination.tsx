"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Pagination from "@/components/pagination";

interface Props {
  keyword: string;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Server component không truyền được hàm onPageChange xuống Pagination (client),
// nên bọc 1 lớp client mỏng: đổi trang = đổi URL, dữ liệu vẫn do server render.
export function SearchPagination({
  keyword,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handlePageChange = (page: number) => {
    startTransition(() => {
      router.push(
        `/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`,
      );
    });
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      onPageChange={handlePageChange}
      loading={isPending}
    />
  );
}