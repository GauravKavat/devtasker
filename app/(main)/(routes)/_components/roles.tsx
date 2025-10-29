"use client";

import { useProjects } from "@/hooks/use-projects";
import { Loader2 } from "lucide-react";

interface RolesProps {
  projectId?: string;
}

export default function Roles({ projectId }: RolesProps) {
  const { projects, loading } = useProjects();
  const project = projects.find((p) => p.id === projectId);

  return (
    <div className="flex flex-col">
      <h1>Roles</h1>
      {projectId && (
        <p className="text-muted-foreground mt-2">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading project...
            </span>
          ) : project ? (
            <>Viewing roles for project: {project.name}</>
          ) : (
            <>Viewing roles for project: {projectId}</>
          )}
        </p>
      )}
    </div>
  );
}
