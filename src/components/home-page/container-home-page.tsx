import { MovieItem } from "@/types/movie-list.types";
import MovieList from "../movie-list";
import HomeHero from "./home-hero";
import { ContinueWatchingSection } from "../watch-history/continue-watching-section";

interface ApiResponse {
  status: boolean;
  msg: string;
  items: MovieItem[];
  pagination: {
    totalItems: number;
    totalItemsPerPage: number;
    currentPage: number;
    totalPages: number;
    updateToday: number;
  };
}

interface ContainerHomePageProps {
  initialData?: ApiResponse | null;
}

const ContainerHomePage = ({ initialData }: ContainerHomePageProps) => {
  return (
    <main className="space-y-6">
      <HomeHero movies={initialData?.items || []} />
      <ContinueWatchingSection />
      <MovieList
        loading={false}
        movies={initialData?.items || []}
        pagination={undefined}
      />
    </main>
  );
};

export default ContainerHomePage;
