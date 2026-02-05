"use client";

import { useMemo } from "react";
import { Loader2, CalendarClock, Users, ListChecks, AlertTriangle } from "lucide-react";
import { useKanban } from "@/hooks/use-kanban";
import { useProjectMembers } from "@/hooks/use-project-members";
import { useMeetings } from "@/hooks/use-meetings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChartCard } from "@/components/charts";
import { cn } from "@/lib/utils";

interface OverviewProps {
  projectId?: string;
  projectName?: string;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function Overview({ projectId, projectName }: OverviewProps) {
  const { columns, loading: kanbanLoading } = useKanban(projectId || "");
  const { members, loading: membersLoading } = useProjectMembers(projectId || "");
  const { meetings, loading: meetingsLoading } = useMeetings(projectId);

  const {
    totalTasks,
    completedTasks,
    overdueTasks,
    upcomingTasks,
    tasksByColumn,
    upcomingMeetings,
  } = useMemo(() => {
    const now = new Date();
    const inSevenDays = new Date();
    inSevenDays.setDate(now.getDate() + 7);

    const doneColumnIds = new Set(
      columns
        .filter((column) => /done|complete|completed/i.test(column.name))
        .map((column) => column.id),
    );

    const allTasks = columns.flatMap((column) =>
      column.tasks.map((task) => ({
        ...task,
        columnName: column.name,
      })),
    );

    const completed = allTasks.filter((task) => doneColumnIds.has(task.column_id)).length;
    const overdue = allTasks.filter((task) => {
      if (!task.end_date) return false;
      const end = new Date(task.end_date);
      return end < now && !doneColumnIds.has(task.column_id);
    }).length;

    const upcoming = allTasks.filter((task) => {
      if (!task.end_date) return false;
      const end = new Date(task.end_date);
      return end >= now && end <= inSevenDays && !doneColumnIds.has(task.column_id);
    }).length;

    const chartData = columns.map((column) => ({
      name: column.name,
      Tasks: column.tasks.length,
    }));

    const upcomingMeetingsList = meetings
      .filter((meeting) => new Date(meeting.start_time) >= now)
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      )
      .slice(0, 3);

    return {
      totalTasks: allTasks.length,
      completedTasks: completed,
      overdueTasks: overdue,
      upcomingTasks: upcoming,
      tasksByColumn: chartData,
      upcomingMeetings: upcomingMeetingsList,
    };
  }, [columns, meetings]);

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">No project selected.</p>
      </div>
    );
  }

  const isLoading = kanbanLoading || membersLoading || meetingsLoading;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{projectName || "Project"} Overview</h1>
          <p className="text-sm text-muted-foreground">
            Key metrics and upcoming items at a glance.
          </p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Refreshing...
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total tasks</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalTasks}</div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{completedTasks} completed</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Upcoming due</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{upcomingTasks}</div>
            <p className="text-xs text-muted-foreground">Due in the next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Overdue tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-semibold", overdueTasks > 0 && "text-destructive")}>
              {overdueTasks}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Team members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{members.length}</div>
            <p className="text-xs text-muted-foreground">Active on this project</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <BarChartCard
          title="Tasks by column"
          description="Distribution of tasks across your workflow"
          data={tasksByColumn}
          dataKeys={[{ key: "Tasks", name: "Tasks" }]}
          height={260}
        />

        <Card>
          <CardHeader>
            <CardTitle>Upcoming meetings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Next 3 scheduled sessions
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No meetings scheduled.</p>
            ) : (
              upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{meeting.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {dateTimeFormatter.format(new Date(meeting.start_time))}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
