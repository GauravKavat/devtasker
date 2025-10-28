"use client";

import * as React from "react";
import { Check, ChevronsUpDown, FolderKanban, Home } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useProjects } from "@/hooks/use-projects";
import { createSlug } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function ProjectSwitcher() {
  const router = useRouter();
  const params = useParams();
  const { projects, loading } = useProjects();
  const projectSlug = params.projectSlug as string | undefined;

  const currentProject = React.useMemo(() => {
    if (!projectSlug || !projects.length) return null;
    return projects.find((p) => createSlug(p.name) === projectSlug);
  }, [projects, projectSlug]);

  const handleProjectSelect = (projectName: string) => {
    const slug = createSlug(projectName);
    router.push(`/projects/${slug}`);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <FolderKanban className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">
                  {loading
                    ? "Loading..."
                    : currentProject
                      ? currentProject.name
                      : "Select Project"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {currentProject ? "Project Dashboard" : "No project selected"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width]"
            align="start"
          >
            {projects.length === 0 ? (
              <DropdownMenuItem disabled>No projects yet</DropdownMenuItem>
            ) : (
              projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onSelect={() => handleProjectSelect(project.name)}
                  className="gap-2"
                >
                  <FolderKanban className="size-4" />
                  <span className="flex-1">{project.name}</span>
                  {currentProject?.id === project.id && (
                    <Check className="size-4" />
                  )}
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => router.push("/projects")}
              className="gap-2"
            >
              <Home className="size-4" />
              <span>View All Projects</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
