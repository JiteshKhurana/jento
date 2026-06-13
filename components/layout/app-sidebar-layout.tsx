"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

type AppSidebarLayoutProps = {
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function AppSidebarLayout({
  children,
  defaultOpen = true,
}: AppSidebarLayoutProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      {children}
    </SidebarProvider>
  );
}
