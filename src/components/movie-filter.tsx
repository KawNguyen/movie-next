"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, RotateCcw } from "lucide-react";
import { MovieListParams } from "@/types/movie-list.types";
import { data } from "@/constant/routes";

interface MovieFilterProps {
  onFilterChange: (params: MovieListParams) => void;
  loading?: boolean;
  initialFilters?: MovieListParams;
  pageType?: "category" | "country" | "genre" | "default"; // Thêm page type
  currentSlug?: string; // Slug hiện tại để exclude khỏi filter
}

export default function MovieFilter({
  onFilterChange,
  loading = false,
  initialFilters = {},
  pageType = "default",
  currentSlug,
}: MovieFilterProps) {
  const [filters, setFilters] = useState<MovieListParams>(initialFilters);

  const handleFilterChange = (key: keyof MovieListParams, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value === "all" ? undefined : value,
      page: 1, // Reset to first page when filter changes
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const resetFilters = { page: 1 };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const categories =
    data.navMain.find((item) => item.title === "Thể loại")?.items || [];
  const countries =
    data.navMain.find((item) => item.title === "Quốc gia")?.items || [];

  return (
    <Card className="mb-6">
      <CardHeader className="">
        <CardTitle className="flex justify-between gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc tìm kiếm
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Đặt lại bộ lọc
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Sắp xếp theo
            </label>
            <Select
              value={filters.sort_field || "all"}
              onValueChange={(value) => handleFilterChange("sort_field", value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="time">Thời gian</SelectItem>
                <SelectItem value="name">Tên phim</SelectItem>
                <SelectItem value="year">Năm sản xuất</SelectItem>
                <SelectItem value="view">Lượt xem</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Thứ tự</label>
            <Select
              value={filters.sort_type || "all"}
              onValueChange={(value) => handleFilterChange("sort_type", value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="desc">Giảm dần</SelectItem>
                <SelectItem value="asc">Tăng dần</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Năm</label>
            <Select
              value={filters.year?.toString() || "all"}
              onValueChange={(value) => handleFilterChange("year", value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {Array.from(
                  { length: 10 },
                  (_, i) => new Date().getFullYear() - i
                ).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {pageType !== "genre" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Thể loại</label>
              <Select
                value={filters.category || "all"}
                onValueChange={(value) => handleFilterChange("category", value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {categories
                    .filter((category) =>
                      currentSlug
                        ? category.url.split("/").pop() !== currentSlug
                        : true
                    )
                    .map((category) => (
                      <SelectItem
                        key={category.url}
                        value={category.url.split("/").pop() || ""}
                      >
                        {category.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {pageType !== "country" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Quốc gia</label>
              <Select
                value={filters.country || "all"}
                onValueChange={(value) => handleFilterChange("country", value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {countries
                    .filter((country) =>
                      currentSlug
                        ? country.url.split("/").pop() !== currentSlug
                        : true
                    )
                    .map((country) => (
                      <SelectItem
                        key={country.url}
                        value={country.url.split("/").pop() || ""}
                      >
                        {country.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
