"use client";

import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanColumn,
  KanbanHeader,
  KanbanProvider,
} from "@/components/ui/shadcn-io/kanban";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Trash2, ChevronUp, ChevronDown } from "lucide-react";

import {
  useKanban,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useMoveTask,
  useCreateColumn,
  useUpdateColumn,
  useDeleteColumn,
} from "@/hooks/use-kanban";
import { TaskGitHubLinks, ImportIssuesDialog } from "@/components/github";
import { useProjectRepos } from "@/hooks/use-github";
import { useProjectRole } from "@/hooks/use-project-role";
import { useProjectMembers } from "@/hooks/use-project-members";
import { TaskDialog } from "@/components/task-dialog";
import { CreateBranchButton } from "@/components/github";

import { format } from "date-fns";

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
  const { columns: dbColumns, error } = useKanban(projectId || "");
  const { data: repos } = useProjectRepos(projectId);
  const { isAdmin } = useProjectRole(projectId || "");
  const { members } = useProjectMembers(projectId || "");
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();
  const moveTask = useMoveTask();
  const updateTask = useUpdateTask();
  const createColumn = useCreateColumn();
  const updateColumn = useUpdateColumn();
  const deleteColumn = useDeleteColumn();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState<string | null>(null);
  const [isMovingTask, setIsMovingTask] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [columnDrafts, setColumnDrafts] = useState<Record<string, string>>({});
  const [orderedColumns, setOrderedColumns] = useState<
    { id: string; name: string; color: string }[]
  >([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const assignees = (members || [])
    .map((member: any) => member.user)
    .filter(Boolean);

  const selectedTask = selectedTaskId
    ? dbColumns
        .flatMap((col) => col.tasks)
        .find((task) => task.id === selectedTaskId)
    : null;

  const kanbanColumns = dbColumns.map((col) => ({
    id: col.id,
    name: col.name,
    color: col.color || "#94a3b8",
  }));

  useEffect(() => {
    setOrderedColumns(kanbanColumns);
  }, [dbColumns]);

  const handleCreateColumn = async () => {
    if (!projectId || !newColumnName.trim()) return;
    setIsSubmitting(true);
    try {
      await createColumn(projectId, newColumnName.trim());
      setNewColumnName("");
    } catch (error) {
      console.error("Failed to create column:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveColumn = async (columnId: string, direction: "up" | "down") => {
    const ordered = [...dbColumns].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const index = ordered.findIndex((col) => col.id === columnId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) {
      return;
    }

    const current = ordered[index];
    const target = ordered[targetIndex];

    setIsSubmitting(true);
    try {
      await Promise.all([
        updateColumn(current.id, { position: target.position ?? 0 }),
        updateColumn(target.id, { position: current.position ?? 0 }),
      ]);
    } catch (error) {
      console.error("Failed to reorder columns:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateColumn = async (columnId: string) => {
    const name = columnDrafts[columnId];
    if (!name || !name.trim()) return;
    setIsSubmitting(true);
    try {
      await updateColumn(columnId, { name: name.trim() });
    } catch (error) {
      console.error("Failed to update column:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm("Delete this column? All tasks in it will be removed.")) {
      return;
    }
    setIsSubmitting(true);
    try {
      await deleteColumn(columnId);
    } catch (error) {
      console.error("Failed to delete column:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleColumnsChange = async (
    nextColumns: { id: string; name: string; color: string }[],
  ) => {
    setOrderedColumns(nextColumns);

    if (!isAdmin) return;

    setIsSubmitting(true);
    try {
      await Promise.all(
        nextColumns.map((column, index) =>
          updateColumn(column.id, { position: index })
        )
      );
    } catch (error) {
      console.error("Failed to reorder columns:", error);
    } finally {
      setIsSubmitting(false);
    }
  };


  const openDialog = (columnId: string) => {
    setSelectedColumn(columnId);
    setIsDialogOpen(true);
  };

  const openEditDialog = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsEditDialogOpen(true);
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
      {isAdmin && (
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="New column name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              disabled={isSubmitting}
              className="max-w-sm"
            />
            <Button onClick={handleCreateColumn} disabled={isSubmitting || !newColumnName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            {dbColumns.map((column) => (
              <div
                key={column.id}
                className="flex items-center gap-2 border rounded-md p-2"
              >
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveColumn(column.id, "up")}
                    disabled={isSubmitting}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveColumn(column.id, "down")}
                    disabled={isSubmitting}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  value={columnDrafts[column.id] ?? column.name}
                  onChange={(e) =>
                    setColumnDrafts((prev) => ({
                      ...prev,
                      [column.id]: e.target.value,
                    }))
                  }
                />
                <Button
                  variant="outline"
                  onClick={() => handleUpdateColumn(column.id)}
                  disabled={isSubmitting}
                >
                  Save
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteColumn(column.id)}
                  disabled={isSubmitting}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">

        {/* Update in progress indicator */}
        {isMovingTask && (
          <div className="bg-background border rounded-lg shadow-lg p-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Updating task...</span>
          </div>
        )}
      </div>
      <KanbanProvider
        columns={orderedColumns.length ? orderedColumns : kanbanColumns}
        data={features}
        onColumnsChange={handleColumnsChange}
        onDragEnd={async (event) => {
          const { active, over } = event;

          if (typeof active.id === "string" && active.id.startsWith("column:")) {
            return;
          }
          
          if (!over || active.id === over.id) return;

          console.log("onDragEnd:", { activeId: active.id, overId: over.id });

          try {
            setIsMovingTask(true);

            // Find the task that was dragged
            const activeTask = features.find((f) => f.id === active.id);
            if (!activeTask) {
              console.log("Active task not found");
              return;
            }

            // Determine the new column
            // 'over' could be another task or a column
            const overTask = features.find((f) => f.id === over.id);
            const newColumnId = overTask?.column || (over.id as string);

            console.log("Active task:", activeTask);
            console.log("New column:", newColumnId);
            console.log("Old column:", activeTask.column);

            // If the column changed, update it
            if (activeTask.column !== newColumnId) {
              // Get tasks in the new column to determine position
              const tasksInNewColumn = features.filter(
                (f) => f.column === newColumnId
              );
              const newPosition = overTask
                ? tasksInNewColumn.findIndex((f) => f.id === over.id)
                : tasksInNewColumn.length;

              console.log("Moving task to new column:", {
                taskId: active.id,
                newColumnId,
                newPosition,
              });

              await moveTask(active.id as string, newColumnId, newPosition);
            } else {
              // Just reordering within the same column
              const tasksInColumn = features.filter(
                (f) => f.column === activeTask.column
              );
              const oldIndex = tasksInColumn.findIndex((f) => f.id === active.id);
              const newIndex = tasksInColumn.findIndex((f) => f.id === over.id);

              if (oldIndex !== newIndex) {
                console.log("Reordering within column:", {
                  taskId: active.id,
                  oldIndex,
                  newIndex,
                });

                await moveTask(
                  active.id as string,
                  activeTask.column,
                  newIndex
                );
              }
            }
          } catch (error) {
            console.error("Failed to move task:", error);
          } finally {
            setIsMovingTask(false);
          }
        }}
        onDataChange={() => {}}
      >
        {(column) => (
          <KanbanColumn id={column.id} key={column.id}>
            <KanbanBoard id={column.id}>
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
                    onClick={() => openEditDialog(feature.id)}
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
                        {projectId && repos && repos.length > 0 && (
                          <CreateBranchButton
                            taskId={feature.id}
                            taskTitle={feature.name}
                            projectId={projectId}
                            repoOwner={repos[0].repo_owner}
                            repoName={repos[0].repo_name}
                            baseBranch={repos[0].default_branch || "main"}
                          />
                        )}
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
          </KanbanColumn>
        )}
      </KanbanProvider>
      <TaskDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        columnId={selectedColumn}
        assignees={assignees}
        mode="create"
        onSubmit={async (values) => {
          if (!selectedColumn) return;
          await createTask(selectedColumn, {
            title: values.title,
            description: values.description || null,
            assignee_id: values.assignee_id || null,
            start_date: values.start_date.toISOString(),
            end_date: values.end_date.toISOString(),
          });
          setIsDialogOpen(false);
        }}
      />
      <TaskDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        task={selectedTask || undefined}
        assignees={assignees}
        mode="edit"
        onSubmit={async (values) => {
          if (!selectedTaskId) return;
          await updateTask(selectedTaskId, {
            title: values.title,
            description: values.description || null,
            assignee_id: values.assignee_id || null,
            start_date: values.start_date.toISOString(),
            end_date: values.end_date.toISOString(),
          });
          setIsEditDialogOpen(false);
          setSelectedTaskId(null);
        }}
      />
    </>
  );
}
