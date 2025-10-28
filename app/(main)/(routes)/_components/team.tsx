"use client";

interface TeamsProps {
  projectId?: string;
}

export default function Teams({ projectId }: TeamsProps) {
  return (
    <div className="flex flex-col">
      <h1>Teams</h1>
      {projectId && (
        <p className="text-muted-foreground mt-2">
          Viewing team members for project: {projectId}
        </p>
      )}
    </div>
  );
}
