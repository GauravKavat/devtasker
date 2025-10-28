"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useTransition } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SearchForm } from "@/components/search-form";
import { UserNav } from "@/components/user-nav";
import Gantt from "../_components/gantt";
import Projects from "../_components/projects";
import { Loader2 } from "lucide-react";

// Navigation data for projects sidebar
const projectsNavData = [
  {
    title: "Project Views",
    items: [
      {
        title: "Projects",
        url: "/projects",
        view: "projects",
      },
      {
        title: "Gantt Chart",
        url: "/projects?view=gantt",
        view: "gantt",
      },
    ],
  },
];

function ProjectsContentWithParams() {
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "projects";

  const getBreadcrumbInfo = () => {
    switch (currentView) {
      case "gantt":
        return { section: "Projects", page: "Gantt Chart" };
      default:
        return { section: "Projects", page: "Overview" };
    }
  };

  const breadcrumbInfo = getBreadcrumbInfo();

  const renderContent = () => {
    switch (currentView) {
      case "gantt":
        return <Gantt />;
      default:
        return <Projects />;
    }
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              {breadcrumbInfo.section}
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>{breadcrumbInfo.page}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">{renderContent()}</div>
    </>
  );
}

function ProjectsSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "projects";

  return (
    <Sidebar>
      <SidebarHeader>
        <div
          className="flex items-center justify-center gap-x-4 p-2 border-b border-muted cursor-pointer"
          onClick={() => {
            router.push("/");
          }}
        >
          <Image
            src="/devtasker.svg"
            alt="DevTasker Logo"
            width={28}
            height={28}
            className="dark:invert"
          />
          <h1 className="flex items-baseline text-3xl font-semibold mt-1">
            DevTasker
          </h1>
        </div>
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {projectsNavData.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
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
    </Sidebar>
  );
}

export default function ProjectsPage() {
  return (
    <SidebarProvider>
      <Suspense fallback={<div>Loading sidebar...</div>}>
        <ProjectsSidebar />
      </Suspense>
      <SidebarInset>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <ProjectsContentWithParams />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
