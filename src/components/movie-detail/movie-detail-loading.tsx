import {
  CastCrewSkeleton,
  EpisodeListSkeleton,
  MovieHeroSkeleton,
  MovieInfoSkeleton,
  MovieStatsSkeleton,
  VideoPlayerSkeleton,
} from "./skeletons";
import { MAIN_GRID } from "./movie-detail-layout";

export function MovieDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative px-4">
        <div className="absolute inset-x-0 top-0 -z-0 h-[60vh]">
          <div className="size-full animate-pulse bg-muted" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
        <div className="relative space-y-8 pt-8">
          <MovieHeroSkeleton />
          <div className="space-y-4">
            <div className={MAIN_GRID}>
              <VideoPlayerSkeleton />
              <EpisodeListSkeleton />
            </div>
            <div className={MAIN_GRID}>
              <div className="grid content-start gap-4">
                <MovieInfoSkeleton />
                <CastCrewSkeleton />
              </div>
              <MovieStatsSkeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
