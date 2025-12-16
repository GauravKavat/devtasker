"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskForm, type TaskFormValues } from "@/components/task-form";
import type { Task, User } from "@/lib/supabase/types";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Partial<Task>;
  columnId?: string;
  assignees?: User[];
  onSubmit: (values: TaskFormValues) => Promise<void> | void;
  mode?: "create" | "edit";
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  columnId,
  assignees,
  onSubmit,
  mode = "create",
}: TaskDialogProps) {
  const handleSubmit = async (values: TaskFormValues) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Task" : "Edit Task"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Fill in the details below to create a new task."
              : "Update the task details below."}
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          task={task}
          columnId={columnId}
          assignees={assignees}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel={mode === "create" ? "Create Task" : "Save Changes"}
        />
      </DialogContent>
    </Dialog>
  );
}
