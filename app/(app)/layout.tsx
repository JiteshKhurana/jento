import { cookies } from "next/headers";
import { AppSidebarLayout } from "@/components/layout/app-sidebar-layout";
import { PendoIdentifier } from "@/components/pendo-identifier";
import { getCurrentDbUser } from "@/lib/auth";
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

  const dbUser = await getCurrentDbUser();
  const pendoUser = dbUser
    ? {
        id: dbUser.id,
        clerkId: dbUser.clerkId,
        email: dbUser.email,
        name: dbUser.name,
        profileImageUrl: dbUser.profileImageUrl,
        createdAt: dbUser.createdAt.toISOString(),
        updatedAt: dbUser.updatedAt.toISOString(),
      }
    : null;

  return (
    <AppSidebarLayout defaultOpen={defaultOpen}>
      <PendoIdentifier user={pendoUser} />
      {children}
    </AppSidebarLayout>
  );
}
