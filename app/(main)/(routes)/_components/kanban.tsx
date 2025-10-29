"use client";

import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from "@/components/ui/shadcn-io/kanban";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Plus, CalendarIcon, Loader2, Trash2 } from "lucide-react";

import { useKanban, useCreateTask, useDeleteTask } from "@/hooks/use-kanban";
import { useProjects } from "@/hooks/use-projects";
import { TaskGitHubLinks, ImportIssuesDialog } from "@/components/github";
import { useProjectRepos } from "@/hooks/use-github";

import { format } from "date-fns";

// type BackgroundColor = string;

// type Column = {
//   id: string;
//   name: string;
//   color?: BackgroundColor;
// };

// type Feature = {
//   id: string;
//   name: string;
//   column: string;
//   description?: string;
//   startAt: Date;
//   endAt: Date;
//   owner?: {
//     name: string;
//     image: string;
//   };
// };

// const columns: Column[] = [
//   { id: "backlog", name: "Backlog", color: "#94a3b8" },
//   { id: "todo", name: "To Do", color: "#60a5fa" },
//   { id: "in-progress", name: "In Progress", color: "#fbbf24" },
//   { id: "done", name: "Done", color: "#34d399" },
// ];

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface KanbanProps {
  projectId?: string;
}

export default function Kanban({ projectId }: KanbanProps) {
  const { columns: dbColumns, loading, error } = useKanban(projectId || "");
  const { projects, loading: projectsLoading } = useProjects();
  const { data: repos } = useProjectRepos(projectId);
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  });
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const handleAddTask = async () => {
    if (
      !newTask.title ||
      !newTask.startDate ||
      !newTask.endDate ||
      !selectedColumn
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createTask(selectedColumn, {
        title: newTask.title,
        description: newTask.description || null,
        start_date: newTask.startDate.toISOString(),
        end_date: newTask.endDate.toISOString(),
      });

      setIsDialogOpen(false);
      setNewTask({
        title: "",
        description: "",
        startDate: undefined,
        endDate: undefined,
      });
      setShowStartCalendar(false);
      setShowEndCalendar(false);
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDialog = (columnId: string) => {
    setSelectedColumn(columnId);
    setIsDialogOpen(true);
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    setIsDeletingTask(taskId);
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error("Failed to delete task:", error);
      alert("Failed to delete task. Please try again.");
    } finally {
      setIsDeletingTask(null);
    }
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          Please select a project to view the Kanban board.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">
          Error loading Kanban board: {error.message}
        </p>
      </div>
    );
  }

  // Transform database columns and tasks
  const kanbanColumns = dbColumns.map((col) => ({
    id: col.id,
    name: col.name,
    color: col.color || "#94a3b8",
  }));

  const features = dbColumns.flatMap((col) =>
    col.tasks.map((task) => ({
      id: task.id,
      name: task.title,
      column: col.id,
      description: task.description || undefined,
      startAt: task.start_date ? new Date(task.start_date) : new Date(),
      endAt: task.end_date ? new Date(task.end_date) : new Date(),
      owner: task.assignee
        ? {
            name: task.assignee.clerk_user_id || "Unknown",
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignee.clerk_user_id || "U")}`,
          }
        : undefined,
    })),
  );

  return (
    <>
      {/*{projectId && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {projectsLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading project...
              </span>
            ) : (
              <>
                Viewing Kanban board for project:{" "}
                {projects.find((p) => p.id === projectId)?.name || projectId}
              </>
            )}
          </p>
        </div>
      )}*/}
      <KanbanProvider
        columns={kanbanColumns}
        data={features}
        onDataChange={() => {}}
      >
        {(column) => (
          <KanbanBoard id={column.id} key={column.id}>
            <KanbanHeader>
              <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <span>{column.name}</span>
                </div>
                {projectId && repos && repos.length > 0 && (
                  <ImportIssuesDialog
                    projectId={projectId}
                    columnId={column.id}
                    repoOwner={repos[0].repo_owner}
                    repoName={repos[0].repo_name}
                  />
                )}
              </div>
            </KanbanHeader>
            <KanbanCards id={column.id}>
              {(feature: (typeof features)[number]) => (
                <KanbanCard
                  column={column.id}
                  id={feature.id}
                  key={feature.id}
                  name={feature.name}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1 flex-1">
                      <p className="m-0 font-medium text-sm">{feature.name}</p>
                      {feature.description && (
                        <p className="m-0 text-muted-foreground text-xs">
                          {feature.description}
                        </p>
                      )}
                      <TaskGitHubLinks taskId={feature.id} compact />
                    </div>
                    <div className="flex items-center gap-1 shrink-0 relative z-50">
                      {feature.owner && (
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={feature.owner.image} />
                          <AvatarFallback>
                            {feature.owner.name?.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <button
                        onClick={(e) => handleDeleteTask(feature.id, e)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        disabled={isDeletingTask === feature.id}
                        className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50 relative z-50"
                        title="Delete task"
                      >
                        {isDeletingTask === feature.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="m-0 text-muted-foreground text-xs">
                    {shortDateFormatter.format(feature.startAt)} -{" "}
                    {dateFormatter.format(feature.endAt)}
                  </p>
                </KanbanCard>
              )}
            </KanbanCards>
            <div className="px-2 pb-2 pt-2">
              <button
                onClick={() => openDialog(column.id)}
                className="w-full cursor-pointer gap-4 rounded-md border-2 border-dashed border-muted-foreground/25 bg-transparent px-3 py-4 shadow-sm transition-colors hover:border-muted-foreground/50 hover:bg-muted/50"
              >
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">Add Task</span>
                </div>
              </button>
            </div>
          </KanbanBoard>
        )}
      </KanbanProvider>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task in the{" "}
              {kanbanColumns.find((c) => c.id === selectedColumn)?.name} column.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                placeholder="Enter task title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Task Description</Label>
              <Input
                id="description"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                placeholder="Enter task description (optional)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <div className="relative">
                  <Button
                    id="startDate"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    onClick={() => setShowStartCalendar(!showStartCalendar)}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTask.startDate ? (
                      format(newTask.startDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                  {showStartCalendar && (
                    <div className="absolute top-full left-0 z-50 mt-2 rounded-md border bg-popover p-0 shadow-md">
                      <Calendar
                        mode="single"
                        selected={newTask.startDate}
                        onSelect={(date) => {
                          setNewTask({ ...newTask, startDate: date });
                          setShowStartCalendar(false);
                        }}
                        initialFocus
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <div className="relative">
                  <Button
                    id="endDate"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    onClick={() => setShowEndCalendar(!showEndCalendar)}
                    type="button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTask.endDate ? (
                      format(newTask.endDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                  {showEndCalendar && (
                    <div className="absolute top-full left-0 z-50 mt-2 rounded-md border bg-popover p-0 shadow-md">
                      <Calendar
                        mode="single"
                        selected={newTask.endDate}
                        onSelect={(date) => {
                          setNewTask({ ...newTask, endDate: date });
                          setShowEndCalendar(false);
                        }}
                        initialFocus
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddTask}
              disabled={
                isSubmitting ||
                !newTask.title ||
                !newTask.startDate ||
                !newTask.endDate
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
