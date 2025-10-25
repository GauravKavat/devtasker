"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { SearchForm } from "@/components/search-form";
import { VersionSwitcher } from "@/components/version-switcher";
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

// DevTasker navigation data
const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Project Management",
      url: "/dashboard",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          view: "dashboard",
        },
        {
          title: "Kanban Board",
          url: "/dashboard?view=kanban",
          view: "kanban",
        },
        {
          title: "Calendar",
          url: "/dashboard?view=calendar",
          view: "calendar",
        },
      ],
    },
    {
      title: "Team & Collaboration",
      url: "/dashboard?view=team",
      items: [
        {
          title: "Team Members",
          url: "/dashboard?view=team",
          view: "team",
        },
        {
          title: "Roles & Permissions",
          url: "/dashboard?view=roles",
          view: "roles",
        },
      ],
    },
    {
      title: "Integration",
      url: "/dashboard?view=github",
      items: [
        {
          title: "GitHub",
          url: "/dashboard?view=github",
          view: "github",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "dashboard";

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0]}
        />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
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
                      <a href={item.url}>{item.title}</a>
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
