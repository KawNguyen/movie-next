import { EpisodeListSkeleton } from "./episode-list-skeleton";
import { VideoPlayerSkeleton } from "./video-player-skeleton";
import { MAIN_GRID } from "../movie-detail-layout";

export function WatchSectionSkeleton() {
  return (
    <div className={MAIN_GRID}>
      <VideoPlayerSkeleton />
      <EpisodeListSkeleton />
    </div>
  );
}
