import { ReceiptText, Star } from "lucide-react";
import { Movie } from "@/types/movie-detail.types";

interface MovieStatsProps {
  movie: Movie;
}

// Không cần "use client": component thuần hiển thị -> giảm JS gửi xuống trình duyệt
export function MovieStats({ movie }: MovieStatsProps) {
  const country = movie.country?.map((c) => c.name).join(", ");
  const rating = movie.tmdb?.vote_average;

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Năm sản xuất", value: movie.year },
    { label: "Quốc gia", value: country },
    { label: "Thời lượng", value: movie.time },
    { label: "Chất lượng", value: movie.quality },
    { label: "Ngôn ngữ", value: movie.lang },
    {
      label: "Đánh giá",
      value: rating ? (
        <span className="inline-flex items-center gap-1">
          <Star className="size-4 fill-yellow-500 text-yellow-500" />
          {rating.toFixed(1)}/10
        </span>
      ) : null,
    },
  ];

  return (
    <section className="h-full rounded-xl border bg-card p-5">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <ReceiptText className="size-5 text-primary" />
        Thông tin chi tiết
      </h2>
      <dl className="divide-y">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4 py-2.5 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium">{value || "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}