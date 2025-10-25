"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, Suspense } from "react";
import Kanban from "@/app/(main)/(routes)/_components/kanban";
import Calendar from "@/app/(main)/(routes)/_components/calender";
import Github from "@/app/(main)/(routes)/_components/github";
import Teams from "@/app/(main)/(routes)/_components/team";
import Roles from "@/app/(main)/(routes)/_components/roles";

function DashboardContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "dashboard";
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/unauthorized");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  const getPageContent = () => {
    switch (view) {
      case "kanban":
        return <Kanban />;
      case "calendar":
        return <Calendar />;
      case "github":
        return <Github />;
      case "team":
        return <Teams />;
      case "roles":
        return <Roles />;
      default:
        return (
          <div className="flex flex-col w-full p-6">
            <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to DevTasker - Your project management hub.
            </p>
            <div className="grid auto-rows-min gap-4 md:grid-cols-3 mt-8">
              <div className="bg-muted/50 aspect-video rounded-xl" />
              <div className="bg-muted/50 aspect-video rounded-xl" />
              <div className="bg-muted/50 aspect-video rounded-xl" />
            </div>
          </div>
        );
    }
  };

  const getBreadcrumbInfo = () => {
    switch (view) {
      case "kanban":
        return { section: "Project Management", page: "Kanban Board" };
      case "calendar":
        return { section: "Project Management", page: "Calendar" };
      case "team":
        return { section: "Team & Collaboration", page: "Team Members" };
      case "roles":
        return { section: "Team & Collaboration", page: "Roles & Permissions" };
      case "github":
        return { section: "Integration", page: "GitHub" };
      default:
        return { section: "Dashboard", page: "Overview" };
    }
  };

  const breadcrumbInfo = getBreadcrumbInfo();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">
                  {breadcrumbInfo.section}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {view !== "dashboard" && (
                <>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{breadcrumbInfo.page}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{getPageContent()}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
