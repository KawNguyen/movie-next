"use client";

import { useMemo, useState } from "react";
import { BookText } from "lucide-react";
import { Movie } from "@/types/movie-detail.types";

interface MovieInfoProps {
  movie: Movie;
}

const ENTITIES: Record<string, string> = {
  "&quot;": '"',
  "&apos;": "'",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
};

// Bỏ thẻ HTML trước, giải mã entity sau (tránh "&lt;b&gt;" bị biến thành thẻ rồi bị xoá nhầm)
function cleanContent(text = ""): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;|&apos;|&amp;|&lt;|&gt;/g, (m) => ENTITIES[m] ?? m)
    .trim();
}

const COLLAPSE_AT = 320;

export function MovieInfo({ movie }: MovieInfoProps) {
  const [expanded, setExpanded] = useState(false);
  const text = useMemo(() => cleanContent(movie.content), [movie.content]);
  const long = text.length > COLLAPSE_AT;

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <BookText className="size-5 text-primary" />
        Nội dung phim
      </h2>
      <p
        className={`leading-relaxed text-muted-foreground ${
          long && !expanded ? "line-clamp-4" : ""
        }`}
      >
        {text || "Chưa có mô tả cho phim này."}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {expanded ? "Thu gọn" : "Xem thêm"}
        </button>
      )}
    </section>
  );
}