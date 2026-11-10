import { cn } from "@/lib/utils";
import { SidebarTrigger } from "../ui/sidebar";
import { Separator } from "../ui/separator";
import { SearchMobile } from "../search";
import { SimpleThemeToggle } from "../mode-toggle";
import { MovieBreadcrumb } from "./movie-breadcrumb";

export default function HeaderMovieDetail({
  movieName,
}: {
  movieName: string;
}) {
  return (
    <header
      className={cn(
        "flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)",
      )}
    >
      <div className="flex w-full items-center gap-1 px-2 lg:gap-2 lg:px-4">
        <div className="h-4 flex items-center gap-2">
          <SidebarTrigger className="-ml-1" data-tour="sidebar" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <MovieBreadcrumb movieName={movieName} />
        </div>
        <div className="ml-auto flex items-center gap-2" data-tour="search">
          <SearchMobile />
          <div data-tour="theme">
            <SimpleThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
