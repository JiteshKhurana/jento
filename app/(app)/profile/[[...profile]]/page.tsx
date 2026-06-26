import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProfilePageView } from "@/components/profile/profile-page-view";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <AppShell className="bg-mesh">
      <ProfilePageView />
    </AppShell>
  );
}
