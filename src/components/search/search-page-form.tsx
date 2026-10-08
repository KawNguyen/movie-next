"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchPageForm({ initialKeyword }: { initialKeyword: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialKeyword);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = value.trim();
    if (!keyword) return;
    // transition: UI cũ vẫn giữ nguyên + spinner trong lúc server render trang mới
    startTransition(() => {
      router.push(`/tim-kiem?keyword=${encodeURIComponent(keyword)}`);
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex gap-2 max-w-xl">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Nhập tên phim..."
          className="pl-9"
          autoFocus={!initialKeyword}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tìm kiếm"}
      </Button>
    </form>
  );
}
