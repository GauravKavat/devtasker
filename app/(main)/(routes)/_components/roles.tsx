"use client";

interface RolesProps {
  projectId?: string;
}

export default function Roles({ projectId }: RolesProps) {
  return (
    <div className="flex flex-col">
      <h1>Roles</h1>
      {projectId && (
        <p className="text-muted-foreground mt-2">
          Viewing roles for project: {projectId}
        </p>
      )}
    </div>
  );
}
