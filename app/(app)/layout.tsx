import { cookies } from "next/headers";
import { AppSidebarLayout } from "@/components/layout/app-sidebar-layout";
import {
  parseSidebarCookie,
  SIDEBAR_COOKIE_NAME,
} from "@/lib/sidebar/constants";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = parseSidebarCookie(
    cookieStore.get(SIDEBAR_COOKIE_NAME)?.value,
  );

  return (
    <AppSidebarLayout defaultOpen={defaultOpen}>{children}</AppSidebarLayout>
  );
}
