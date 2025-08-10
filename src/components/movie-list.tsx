import { MovieItem } from "@/types/movie-list.types";
import MovieCard from "./movie-card";
import { Skeleton } from "./ui/skeleton";
import Pagination from "./pagination";

interface MovieListProps {
  movies: MovieItem[];
  loading: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
  };
}

export default function MovieList({
  loading,
  movies,
  pagination,
}: MovieListProps) {
  return (
    <section className="">
      <div className="container mx-auto md:px-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6">
          {loading ? (
            <>
              {Array.from({ length: 10 }).map((_, index) => (
                <Skeleton key={index} className="h-80 lg:h-100 xl:h-120" />
              ))}
            </>
          ) : movies.length === 0 ? (
            <div className="col-span-2 lg:col-span-3 xl:col-span-5">
              <p className="text-center text-muted-foreground">
                Không có phim nào được tìm thấy.
              </p>
            </div>
          ) : (
            movies.map((movie, index) => (
              <MovieCard key={movie._id} {...movie} priority={index < 4} />
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && !loading && movies.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={pagination.onPageChange}
            loading={loading}
          />
        )}
      </div>
    </section>
  );
}
