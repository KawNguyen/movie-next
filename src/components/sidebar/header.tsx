import { cn } from "@/lib/utils";
import { SimpleThemeToggle } from "../mode-toggle";
import { SearchMobile } from "../search";
import { Separator } from "../ui/separator";
import { SidebarTrigger } from "../ui/sidebar";
import AppBreadcrumb from "./app-breadcrumb";

export default function Header() {
  return (
    <header
      className={cn(
        "flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)",
      )}
    >
      <div className="flex w-full items-center gap-1 px-2 lg:gap-2 lg:px-4">
        <div className="h-4 flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <AppBreadcrumb />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SearchMobile />
          <SimpleThemeToggle />
        </div>
      </div>
    </header>
  );
}
