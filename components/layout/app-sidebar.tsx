"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Search,
  Map,
  PanelLeft,
  PanelLeftClose,
  Settings,
  Heart,
} from "lucide-react";
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

function SidebarCollapseButton() {
  const { state, toggleSidebar, isMobile } = useSidebar();
  const expanded = state === "expanded";

  if (isMobile) return null;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={toggleSidebar}
        tooltip={expanded ? "Collapse sidebar" : "Expand sidebar"}
        className="cursor-pointer"
      >
        {expanded ? <PanelLeftClose /> : <PanelLeft />}
        <span>{expanded ? "Collapse" : "Expand"}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
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
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip="Jento"
              className="group-data-[collapsible=icon]:justify-center"
            >
              <Link href="/trips">
                <Image
                  src="/logoblack.svg"
                  alt=""
                  width={18}
                  height={32}
                  className="h-8 w-[18px] shrink-0 dark:hidden"
                />
                <Image
                  src="/logowhite.svg"
                  alt=""
                  width={18}
                  height={32}
                  className="hidden h-8 w-[18px] shrink-0 dark:block"
                />
                <span className="font-jento text-xl leading-none text-black group-data-[collapsible=icon]:hidden dark:text-white">
                  JENTO
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  pathname.startsWith(`${link.href}/`);
                const Icon = link.icon;
                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={link.label}
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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarCollapseButton />
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
