import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSearchMovies, SEARCH_PAGE_LIMIT } from "@/lib/search";
import { SearchPagination } from "@/components/search/search-pagination";
import MovieList from "@/components/movie-list";

type SearchParams = Promise<{ keyword?: string; page?: string }>;

function parse({
  keyword = "",
  page = "1",
}: {
  keyword?: string;
  page?: string;
}) {
  return {
    keyword: keyword.trim(),
    page: Math.max(1, parseInt(page, 10) || 1),
  };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { keyword, page } = parse(await searchParams);
  if (!keyword) return { title: "Tìm kiếm phim" };

  const data = await getSearchMovies({ keyword, page }); // dedupe với page nhờ cache()
  const total = data?.data?.params?.pagination?.totalItems ?? 0;

  return {
    title: `Tìm kiếm "${keyword}"${page > 1 ? ` - Trang ${page}` : ""}`,
    description: `${total} kết quả cho từ khóa "${keyword}"`,
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { keyword, page } = parse(await searchParams);

  return (
    <main className="space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold">Tìm kiếm phim</h1>

      {keyword ? (
        // Fallback dùng luôn skeleton của MovieList (loading=true)
        <Suspense
          key={`${keyword}-${page}`}
          fallback={<MovieList movies={[]} loading />}
        >
          <SearchContent keyword={keyword} page={page} />
        </Suspense>
      ) : (
        <p className="py-16 text-center text-muted-foreground">
          Nhập tên phim vào ô tìm kiếm để bắt đầu
        </p>
      )}
    </main>
  );
}

async function SearchContent({
  keyword,
  page,
}: {
  keyword: string;
  page: number;
}) {
  const data = await getSearchMovies({ keyword, page });

  if (!data) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        Có lỗi xảy ra, vui lòng thử lại sau.
      </p>
    );
  }

  const movies = data.data?.items ?? [];
  const pagination = data.data?.params?.pagination;
  const totalItems = pagination?.totalItems ?? movies.length;
  const totalPages =
    pagination?.totalPages ??
    Math.max(1, Math.ceil(totalItems / SEARCH_PAGE_LIMIT));

  if (movies.length === 0 && page > 1) {
    redirect(
      `/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${totalPages}`,
    );
  }

  return (
    <section className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {totalItems} kết quả cho &ldquo;{keyword}&rdquo;
      </p>

      {/* Không truyền prop pagination vì onPageChange là hàm, không đi qua ranh giới server -> client */}
      <MovieList movies={movies} loading={false} />

      <SearchPagination
        keyword={keyword}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={SEARCH_PAGE_LIMIT}
      />
    </section>
  );
}
