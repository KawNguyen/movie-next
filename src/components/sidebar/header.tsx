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
        "sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 transition-all duration-300",
      )}
    >
      <div className="h-4 flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2" />
        <AppBreadcrumb />
      </div>
      <div className="flex items-center gap-2">
        <SearchMobile />
        <SimpleThemeToggle />
      </div>
    </header>
  );
}
