"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { SearchForm } from "@/components/search-form";
import { ProjectSwitcher } from "@/components/project-switcher";
import { UserNav } from "@/components/user-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

// Generate navigation data based on base URL
const getNavData = (baseUrl: string) => [
  {
    title: "Project Management",
    url: baseUrl,
    items: [
      {
        title: "Dashboard",
        url: baseUrl,
        view: "dashboard",
      },
      {
        title: "Kanban Board",
        url: `${baseUrl}?view=kanban`,
        view: "kanban",
      },
      {
        title: "Calendar",
        url: `${baseUrl}?view=calendar`,
        view: "calendar",
      },
    ],
  },
  {
    title: "Team & Collaboration",
    url: `${baseUrl}?view=team`,
    items: [
      {
        title: "Team Members",
        url: `${baseUrl}?view=team`,
        view: "team",
      },
      {
        title: "Roles & Permissions",
        url: `${baseUrl}?view=roles`,
        view: "roles",
      },
    ],
  },
  {
    title: "Integration",
    url: `${baseUrl}?view=github`,
    items: [
      {
        title: "GitHub",
        url: `${baseUrl}?view=github`,
        view: "github",
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentView = searchParams.get("view") || "dashboard";

  // Determine base URL based on current path
  // If we're in a project page, use that path; otherwise use /projects
  const baseUrl = pathname?.startsWith("/projects/")
    ? pathname.split("?")[0]
    : "/projects";

  const navMain = getNavData(baseUrl);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <ProjectSwitcher />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={currentView === item.view}
                    >
                      <Link href={item.url}>{item.title}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <UserNav />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
