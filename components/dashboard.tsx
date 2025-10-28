"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Kanban from "@/app/(main)/(routes)/_components/kanban";
import Calendar from "@/app/(main)/(routes)/_components/calender";
import Github from "@/app/(main)/(routes)/_components/github";
import Teams from "@/app/(main)/(routes)/_components/team";
import Roles from "@/app/(main)/(routes)/_components/roles";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

interface DashboardProps {
  projectId?: string;
}

export function Dashboard({ projectId }: DashboardProps) {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "dashboard";
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [projectName, setProjectName] = useState<string>("");
  const [loading, setLoading] = useState(!!projectId);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/unauthorized");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;

      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from("projects")
          .select("name")
          .eq("id", projectId)
          .single();

        if (error) throw error;
        if (data) {
          setProjectName(data.name);
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  const getPageContent = () => {
    switch (view) {
      case "kanban":
        return <Kanban projectId={projectId} />;
      case "calendar":
        return <Calendar projectId={projectId} />;
      case "github":
        return <Github projectId={projectId} />;
      case "team":
        return <Teams projectId={projectId} />;
      case "roles":
        return <Roles projectId={projectId} />;
      default:
        return (
          <div className="flex flex-col w-full p-6">
            {projectId && (
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/projects")}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">{projectName}</h1>
                  <p className="text-muted-foreground mt-1">
                    Project Dashboard - Overview
                  </p>
                </div>
              </div>
            )}
            {!projectId && (
              <>
                <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
                <p className="text-muted-foreground">
                  Welcome to DevTasker - Your project management hub.
                </p>
              </>
            )}
            <div className="grid auto-rows-min gap-4 md:grid-cols-3 mt-8">
              <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {projectId ? "Quick Stats" : "Total Projects"}
                  </p>
                  <p className="text-2xl font-bold mt-2">Coming Soon</p>
                </div>
              </div>
              <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {projectId ? "Activity Feed" : "Active Tasks"}
                  </p>
                  <p className="text-2xl font-bold mt-2">Coming Soon</p>
                </div>
              </div>
              <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Recent Updates
                  </p>
                  <p className="text-2xl font-bold mt-2">Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const getBreadcrumbInfo = () => {
    const sectionName = projectId ? projectName : "Dashboard";

    switch (view) {
      case "kanban":
        return { section: sectionName, page: "Kanban Board" };
      case "calendar":
        return { section: sectionName, page: "Calendar" };
      case "team":
        return { section: sectionName, page: "Team Members" };
      case "roles":
        return { section: sectionName, page: "Roles & Permissions" };
      case "github":
        return { section: sectionName, page: "GitHub" };
      default:
        return { section: sectionName, page: "Overview" };
    }
  };

  const breadcrumbInfo = getBreadcrumbInfo();

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
            {projectId ? (
              <>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/projects/${projectId}`}>
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
              </>
            ) : (
              <>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/projects">
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
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">{getPageContent()}</div>
    </>
  );
}
