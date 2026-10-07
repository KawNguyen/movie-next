"use client";

import { useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { MovieListParams } from "@/types/movie-list.types";
import { data } from "@/constant/routes";

interface MovieFilterProps {
  onFilterChange: (params: MovieListParams) => void;
  loading?: boolean;
  initialFilters?: MovieListParams;
  pageType?: "category" | "country" | "genre" | "default";
  currentSlug?: string;
}

const SORT_FIELDS: Record<string, string> = {
  time: "Thời gian",
  name: "Tên phim",
  year: "Năm sản xuất",
  view: "Lượt xem",
};

const SORT_TYPES: Record<string, string> = {
  desc: "Giảm dần",
  asc: "Tăng dần",
};

const slugOf = (url: string) => url.split("/").pop() || "";

type FilterKey = "sort_field" | "sort_type" | "year" | "category" | "country";

export default function MovieFilter({
  onFilterChange,
  loading = false,
  initialFilters = {},
  pageType = "default",
  currentSlug,
}: MovieFilterProps) {
  const filters = initialFilters;
  const [open, setOpen] = useState(false);

  const categories =
    data.navMain.find((item) => item.title === "Thể loại")?.items ?? [];
  const countries =
    data.navMain.find((item) => item.title === "Quốc gia")?.items ?? [];

  // Danh sách chọn: ẩn mục đang là trang hiện tại
  const categoryOptions = categories.filter(
    (c) => !currentSlug || slugOf(c.url) !== currentSlug,
  );
  const countryOptions = countries.filter(
    (c) => !currentSlug || slugOf(c.url) !== currentSlug,
  );

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const update = (patch: Partial<MovieListParams>) =>
    onFilterChange({ ...filters, ...patch, page: 1 });

  const setSelect = (key: FilterKey, value: string) => {
    if (key === "year") {
      update({ year: value === "all" ? undefined : Number(value) });
      return;
    }
    update({ [key]: value === "all" ? undefined : value });
  };

  const clearOne = (key: FilterKey) => update({ [key]: undefined });

  const resetFilters = () => onFilterChange({ page: 1 });

  // Chip hiển thị các bộ lọc đang áp dụng
  const activeChips: { key: FilterKey; label: string }[] = [];
  if (filters.sort_field)
    activeChips.push({
      key: "sort_field",
      label: `Sắp xếp theo ${(SORT_FIELDS[filters.sort_field] ?? filters.sort_field).toLowerCase()}`,
    });
  if (filters.sort_type)
    activeChips.push({
      key: "sort_type",
      label: SORT_TYPES[filters.sort_type] ?? filters.sort_type,
    });
  if (filters.year)
    activeChips.push({ key: "year", label: `Năm ${filters.year}` });
  if (filters.category) {
    const found = categories.find((c) => slugOf(c.url) === filters.category);
    activeChips.push({
      key: "category",
      label: found?.title ?? String(filters.category),
    });
  }
  if (filters.country) {
    const found = countries.find((c) => slugOf(c.url) === filters.country);
    activeChips.push({
      key: "country",
      label: found?.title ?? String(filters.country),
    });
  }

  const count = activeChips.length;

  return (
    <section
      aria-label="Bộ lọc phim"
      aria-busy={loading}
      className="rounded-xl border bg-card p-4 sm:p-5"
    >
      {/* Tiêu đề: trên mobile bấm để mở/đóng */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:pointer-events-none"
        >
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Bộ lọc</span>

          {count > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
              {count}
            </span>
          )}

          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform sm:hidden",
              open && "rotate-180",
            )}
          />
        </button>

        {count > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            disabled={loading}
            className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            Đặt lại
          </Button>
        )}
      </div>

      {/* Các ô chọn */}
      <div
        className={cn(
          "mt-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] items-end gap-3",
          open ? "grid" : "hidden sm:grid",
        )}
      >
        <FilterSelect
          label="Sắp xếp theo"
          value={filters.sort_field ?? "all"}
          active={Boolean(filters.sort_field)}
          onValueChange={(v) => setSelect("sort_field", v)}
          disabled={loading}
        >
          <SelectItem value="all">Mặc định</SelectItem>
          {Object.entries(SORT_FIELDS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </FilterSelect>

        {/* Thứ tự: nhóm nút chuyển nhanh, bấm lại để bỏ chọn */}
        <div>
          <span
            id="sort-type-label"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Thứ tự
          </span>

          <div
            role="group"
            aria-labelledby="sort-type-label"
            className="grid h-9 grid-cols-2 gap-1 rounded-md border bg-muted/40 p-0.5"
          >
            <SortButton
              pressed={filters.sort_type === "desc"}
              disabled={loading}
              onClick={() =>
                update({
                  sort_type: filters.sort_type === "desc" ? undefined : "desc",
                })
              }
              icon={<ArrowDownWideNarrow className="size-3.5" />}
              label="Giảm"
            />
            <SortButton
              pressed={filters.sort_type === "asc"}
              disabled={loading}
              onClick={() =>
                update({
                  sort_type: filters.sort_type === "asc" ? undefined : "asc",
                })
              }
              icon={<ArrowUpNarrowWide className="size-3.5" />}
              label="Tăng"
            />
          </div>
        </div>

        <FilterSelect
          label="Năm"
          value={filters.year?.toString() ?? "all"}
          active={Boolean(filters.year)}
          onValueChange={(v) => setSelect("year", v)}
          disabled={loading}
        >
          <SelectItem value="all">Tất cả</SelectItem>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </FilterSelect>

        {pageType !== "genre" && (
          <FilterSelect
            label="Thể loại"
            value={filters.category ?? "all"}
            active={Boolean(filters.category)}
            onValueChange={(v) => setSelect("category", v)}
            disabled={loading}
          >
            <SelectItem value="all">Tất cả</SelectItem>
            {categoryOptions.map((c) => (
              <SelectItem key={c.url} value={slugOf(c.url)}>
                {c.title}
              </SelectItem>
            ))}
          </FilterSelect>
        )}

        {pageType !== "country" && (
          <FilterSelect
            label="Quốc gia"
            value={filters.country ?? "all"}
            active={Boolean(filters.country)}
            onValueChange={(v) => setSelect("country", v)}
            disabled={loading}
          >
            <SelectItem value="all">Tất cả</SelectItem>
            {countryOptions.map((c) => (
              <SelectItem key={c.url} value={slugOf(c.url)}>
                {c.title}
              </SelectItem>
            ))}
          </FilterSelect>
        )}
      </div>

      {/* Bộ lọc đang áp dụng */}
      {count > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          {activeChips.map((chip) => (
            <li key={chip.key}>
              <button
                type="button"
                onClick={() => clearOne(chip.key)}
                disabled={loading}
                aria-label={`Bỏ lọc: ${chip.label}`}
                className="group inline-flex items-center gap-1.5 rounded-full bg-secondary py-1 pl-3 pr-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                {chip.label}
                <X className="size-3.5 opacity-60 group-hover:opacity-100" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface SortButtonProps {
  pressed: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function SortButton({
  pressed,
  disabled,
  onClick,
  icon,
  label,
}: SortButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-[5px] text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        pressed
          ? "bg-background text-foreground shadow-sm ring-1 ring-primary/40"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  active?: boolean;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

function FilterSelect({
  label,
  value,
  active = false,
  onValueChange,
  disabled,
  children,
}: FilterSelectProps) {
  return (
    <div className="min-w-0">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </span>

      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          aria-label={label}
          className={cn(
            "h-9 w-full transition-colors",
            active && "border-primary/50 bg-primary/5 font-medium",
          )}
        >
          <SelectValue />
        </SelectTrigger>

        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}