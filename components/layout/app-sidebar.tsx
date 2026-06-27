"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Search, Map, PanelLeft, PanelLeftClose, Settings, Heart } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
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

const settingsNavLink = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
} as const;

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

export function AppSidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const navLinks = isLoaded && user
    ? [...baseNavLinks, savedNavLink, settingsNavLink]
    : [...baseNavLinks, settingsNavLink];

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

      <SidebarRail />
    </Sidebar>
  );
}
