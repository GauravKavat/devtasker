"use client";

interface GithubProps {
  projectId?: string;
}

export default function Github({ projectId }: GithubProps) {
  return (
    <div className="flex flex-col">
      <h1>Github</h1>
      {projectId && (
        <p className="text-muted-foreground mt-2">
          Viewing GitHub activity for project: {projectId}
        </p>
      )}
    </div>
  );
}
