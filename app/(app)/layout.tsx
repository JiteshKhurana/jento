import { cookies } from "next/headers";
import { AppSidebarLayout } from "@/components/layout/app-sidebar-layout";
import { SIDEBAR_COOKIE_NAME } from "@/components/ui/sidebar";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value;
  const defaultOpen = sidebarState !== "false";

  return (
    <AppSidebarLayout defaultOpen={defaultOpen}>{children}</AppSidebarLayout>
  );
}
