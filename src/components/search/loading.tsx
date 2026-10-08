import MovieList from "@/components/movie-list";

export default function Loading() {
  return (
    <main className="container mx-auto space-y-6 px-4 py-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-10 max-w-xl animate-pulse rounded bg-muted" />
      <MovieList movies={[]} loading />
    </main>
  );
}