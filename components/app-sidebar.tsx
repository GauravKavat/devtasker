"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Type definitions for navigation structure
type NavSubItem = {
  title: string;
  url: string;
  view: string;
};

type NavItem = {
  title: string;
  url: string;
  view: string;
  subItems?: NavSubItem[];
};

type NavSection = {
  title: string;
  url: string;
  items: NavItem[];
};

// Generate navigation data based on base URL
const getNavData = (baseUrl: string): NavSection[] => [
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
        subItems: [
          {
            title: "Repo URL",
            url: `${baseUrl}?view=github-url`,
            view: "github-url",
          },
          {
            title: "Linked Repo",
            url: `${baseUrl}?view=github-repos`,
            view: "github-repos",
          },
        ],
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
                {item.items.map((navItem) => {
                  // Check if this item or any of its sub-items are active
                  const isItemActive = currentView === navItem.view;
                  const hasActiveSubItem = navItem.subItems?.some(
                    (subItem: NavSubItem) => currentView === subItem.view,
                  );
                  const shouldExpand = isItemActive || hasActiveSubItem;

                  // If the nav item has sub-items, render as collapsible
                  if (navItem.subItems && navItem.subItems.length > 0) {
                    return (
                      <Collapsible
                        key={navItem.title}
                        asChild
                        defaultOpen={shouldExpand}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              tooltip={navItem.title}
                              isActive={shouldExpand}
                            >
                              <span>{navItem.title}</span>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {navItem.subItems.map((subItem: NavSubItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={currentView === subItem.view}
                                  >
                                    <Link href={subItem.url}>
                                      <span>{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  // Otherwise, render a regular menu item
                  return (
                    <SidebarMenuItem key={navItem.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={currentView === navItem.view}
                      >
                        <Link href={navItem.url}>{navItem.title}</Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
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
