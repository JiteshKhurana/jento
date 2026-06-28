"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  Heart,
  LogOut,
  Map,
  Moon,
  MoreVertical,
  PanelLeft,
  PanelLeftClose,
  Search,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useSyncExternalStore } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const baseNavLinks = [
  { href: "/trips", label: "My trips", icon: Map },
  { href: "/explore", label: "Explore", icon: Search },
] as const;

const savedNavLink = {
  href: "/saved",
  label: "Saved",
  icon: Heart,
} as const;

type ClerkUser = NonNullable<ReturnType<typeof useUser>["user"]>;

function JentoLogo({ className }: { className?: string }) {
  return (
    <>
      <Image
        src="/logoblack.svg"
        alt=""
        width={18}
        height={32}
        className={cn("h-8 w-[18px] shrink-0 dark:hidden", className)}
      />
      <Image
        src="/logowhite.svg"
        alt=""
        width={18}
        height={32}
        className={cn("hidden h-8 w-[18px] shrink-0 dark:block", className)}
      />
    </>
  );
}

function SidebarBrandHeader() {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const expanded = state === "expanded";

  if (isMobile) return null;

  return (
    <SidebarHeader className="p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
      <div
        className={cn(
          "flex w-full items-center",
          expanded ? "justify-between gap-1" : "justify-center",
        )}
      >
        {expanded ? (
          <>
            <Link
              href="/trips"
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md p-2 transition-colors hover:bg-sidebar-accent"
            >
              <JentoLogo />
              <span className="font-jento truncate text-xl leading-none text-black dark:text-white">
                JENTO
              </span>
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="size-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={toggleSidebar}
            className="group/logo relative flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent"
            aria-label="Expand sidebar"
          >
            <JentoLogo className="transition-opacity group-hover/logo:opacity-0" />
            <PanelLeft className="absolute size-4 opacity-0 transition-opacity group-hover/logo:opacity-100" />
          </button>
        )}
      </div>
    </SidebarHeader>
  );
}

function getUserDisplayName(user: ClerkUser) {
  return (
    user.fullName ??
    user.firstName ??
    user.primaryEmailAddress?.emailAddress ??
    "Account"
  );
}

function UserAvatar({ user }: { user: ClerkUser }) {
  const displayName = getUserDisplayName(user);
  const initials = displayName
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (user.imageUrl) {
    return (
      // Clerk profile images are served from their CDN.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.imageUrl}
        alt=""
        className="size-8 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
      {initials}
    </div>
  );
}

const userMenuItemClassName =
  "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent";

const userMenuDangerItemClassName =
  "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50";

function SidebarUserFooter() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isLoaded || !user) return null;

  const displayName = getUserDisplayName(user);
  const themeLabel =
    mounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode";

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
    setOpen(false);
  }

  function openSignOutDialog() {
    setOpen(false);
    setSignOutDialogOpen(true);
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      setSignOutDialogOpen(false);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      <SidebarFooter className="p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={displayName}
                  className="cursor-pointer group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:hidden group-data-[collapsible=icon]:[&>svg:last-child]:hidden"
                >
                  <UserAvatar user={user} />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">
                    {displayName}
                  </span>
                  <MoreVertical className="ml-auto size-4 shrink-0 text-black dark:text-white" />
                </SidebarMenuButton>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                className="w-52 p-2"
                sideOffset={8}
              >
                <Link
                  href="/profile"
                  className={userMenuItemClassName}
                  onClick={() => setOpen(false)}
                >
                  <User className="size-4 shrink-0" />
                  Profile
                </Link>
                <button
                  type="button"
                  className={userMenuItemClassName}
                  onClick={toggleTheme}
                >
                  {mounted && resolvedTheme === "dark" ? (
                    <Sun className="size-4 shrink-0" />
                  ) : (
                    <Moon className="size-4 shrink-0" />
                  )}
                  {themeLabel}
                </button>
                <button
                  type="button"
                  className={userMenuDangerItemClassName}
                  onClick={openSignOutDialog}
                >
                  <LogOut className="size-4 shrink-0" />
                  Log Out
                </button>
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <Dialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
        <DialogContent
          showClose={false}
          className="max-w-sm gap-0 rounded-3xl p-8 sm:max-w-sm"
        >
          <DialogHeader className="space-y-3 text-center">
            <DialogTitle className="text-xl font-semibold leading-snug">
              Log out?
            </DialogTitle>
            <DialogDescription className="text-left text-neutral-500">
              You will need to sign in again to access your trips and saved
              places.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 cursor-pointer rounded-full"
              onClick={() => setSignOutDialogOpen(false)}
              disabled={signingOut}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-11 flex-1 cursor-pointer rounded-full"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  Logging out…
                </>
              ) : (
                "Yes, log out"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const navLinks =
    isLoaded && user ? [...baseNavLinks, savedNavLink] : baseNavLinks;

  return (
    <Sidebar collapsible="icon">
      <SidebarBrandHeader />

      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:items-center">
          <SidebarGroupContent>
            <SidebarMenu className="group-data-[collapsible=icon]:items-center">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  pathname.startsWith(`${link.href}/`);
                const Icon = link.icon;
                return (
                  <SidebarMenuItem
                    key={link.href}
                    className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                  >
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={link.label}
                      className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:[&>span]:hidden"
                    >
                      <Link href={link.href}>
                        <Icon />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarUserFooter />

      <SidebarRail />
    </Sidebar>
  );
}
