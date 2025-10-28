"use client";

interface CalendarProps {
  projectId?: string;
}

export default function Calendar({ projectId }: CalendarProps) {
  return (
    <div className="flex flex-col">
      <h1>Calendar</h1>
      {projectId && (
        <p className="text-muted-foreground mt-2">
          Viewing calendar for project: {projectId}
        </p>
      )}
    </div>
  );
}
