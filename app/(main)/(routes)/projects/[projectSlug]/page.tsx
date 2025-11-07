"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dashboard } from "@/components/dashboard";
import { useParams, useRouter } from "next/navigation";
import { useProjects } from "@/hooks/use-projects";
import { createSlug, isValidUUID } from "@/lib/utils";

function ProjectDashboardContent() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.projectSlug as string;
  const { projects, loading } = useProjects();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("");

  useEffect(() => {
    if (projects.length > 0 && projectSlug) {
      // Check if the projectSlug is actually a UUID (project ID)
      if (isValidUUID(projectSlug)) {
        // Find project by ID
        const project = projects.find((p) => p.id === projectSlug);

        if (project) {
          // Redirect to slug URL
          const slug = createSlug(project.name);
          router.replace(`/projects/${slug}`);
          return;
        }
      }

      // Find project by slug
      const project = projects.find((p) => createSlug(p.name) === projectSlug);

      if (project) {
        setProjectId(project.id);
        setProjectName(project.name);
      } else if (!loading) {
        router.push("/projects");
      }
    }
  }, [projects, projectSlug, loading, router]);

  if (loading || !projectId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <Dashboard projectId={projectId} projectName={projectName} />;
}

export default function ProjectDashboardPage() {
  return (
    <SidebarProvider>
      <Suspense fallback={<div>Loading sidebar...</div>}>
        <AppSidebar />
      </Suspense>
      <SidebarInset>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <ProjectDashboardContent />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
