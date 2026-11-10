import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { FloatingSidebarButton } from "@/components/sidebar/floating-sidebar-button";
import { GuidedTour } from "@/components/guided-tour";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";
import HeaderWrapper from "@/components/sidebar/header-wrapper";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="border">
        <HeaderWrapper />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
      <FloatingSidebarButton />
      <GuidedTour />
    </SidebarProvider>
  );
};

export default Layout;
