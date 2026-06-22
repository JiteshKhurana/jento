"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Search,
  Map,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Sun,
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

const navLinks = [
  { href: "/trips", label: "My trips", icon: Map },
  { href: "/explore", label: "Explore", icon: Search },
] as const;

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

function SidebarUserProfile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) return null;

  const displayName = user.fullName ?? user.username ?? "User";
  const email = user.primaryEmailAddress?.emailAddress;

  return (
    <SidebarMenuItem>
      <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8 shrink-0",
            },
          }}
        />
        <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
          <p className="truncate text-sm font-medium leading-tight">
            {displayName}
          </p>
          {email ? (
            <p className="truncate text-xs leading-tight text-muted-foreground">
              {email}
            </p>
          ) : null}
        </div>
      </div>
    </SidebarMenuItem>
  );
}

function SidebarThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={toggleTheme}
        tooltip="Toggle theme"
        className="cursor-pointer"
        aria-label="Toggle theme"
      >
        <Sun className="dark:hidden" />
        <Moon className="hidden dark:block" />
        <span>Toggle theme</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip="Jento"
              className="justify-center"
            >
              <Link href="/trips" className="justify-center">
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
          <SidebarThemeToggle />
          <SidebarCollapseButton />
          <SidebarUserProfile />
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
