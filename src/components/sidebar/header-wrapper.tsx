"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Header from "@/components/sidebar/header";

export default function HeaderWrapper() {
  const pathname = usePathname();

  // Ẩn Header tại trang chi tiết phim /phim/:slug
  if (/^\/phim\/[^/]+\/?$/.test(pathname)) {
    return null;
  }

  return <Header />;
}
