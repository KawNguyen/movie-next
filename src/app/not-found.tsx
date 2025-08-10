"use client";

import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-black mb-4">404</h1>

        <h2 className="text-2xl font-medium text-gray-800 mb-2">
          Trang không tìm thấy
        </h2>
        <p className="text-gray-600 mb-8">Trang bạn tìm kiếm không tồn tại.</p>

        <Button asChild className="bg-black text-white hover:bg-gray-800">
          <Link href="/" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Về trang chủ
          </Link>
        </Button>
      </div>
    </div>
  );
}
