"use client";

import { useProjects } from "@/hooks/use-projects";
import { Loader2 } from "lucide-react";

interface TeamsProps {
  projectId?: string;
}

export default function Teams({ projectId }: TeamsProps) {
  const { projects, loading } = useProjects();
  const project = projects.find((p) => p.id === projectId);

  return (
    <div className="flex flex-col">
      <h1>Teams</h1>
      {projectId && (
        <p className="text-muted-foreground mt-2">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading project...
            </span>
          ) : project ? (
            <>Viewing team members for project: {project.name}</>
          ) : (
            <>Viewing team members for project: {projectId}</>
          )}
        </p>
      )}
    </div>
  );
}
