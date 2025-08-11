import { SimpleThemeToggle } from "@/components/mode-toggle";
import { SearchMobile } from "@/components/search";
import AppBreadcrumb from "@/components/sidebar/app-breadcrumb";
import { AppSidebar } from "@/components/sidebar/app-sidebar";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@radix-ui/react-context-menu";
import { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex justify-between h-16 shrink-0 items-center gap-2 px-4">
          <div className="flex items-center gap-2 ">
            <SidebarTrigger className="-ml-1" />
            <Separator className="mr-2 data-[orientation=vertical]:h-4" />
            <AppBreadcrumb />
          </div>
          <div className="flex items-center gap-2">
            <SearchMobile />
            <SimpleThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
