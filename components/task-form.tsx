"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task, User } from "@/lib/supabase/types";

// Task form validation schema
const taskFormSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200, "Title is too long"),
    description: z.string().max(2000, "Description is too long").optional(),
    assignee_id: z.string().optional(),
    start_date: z.date({
      message: "Start date is required",
    }),
    end_date: z.date({
      message: "End date is required",
    }),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "End date must be after or equal to start date",
    path: ["end_date"],
  });

export type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  task?: Partial<Task>;
  columnId?: string;
  assignees?: User[];
  onSubmit: (values: TaskFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
}

export function TaskForm({
  task,
  columnId,
  assignees = [],
  onSubmit,
  onCancel,
  submitLabel = "Create Task",
}: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      assignee_id: task?.assignee_id || undefined,
      start_date: task?.start_date ? new Date(task.start_date) : undefined,
      end_date: task?.end_date ? new Date(task.end_date) : undefined,
    },
  });

  const startDate = watch("start_date");
  const endDate = watch("end_date");
  const assigneeId = watch("assignee_id");

  const handleFormSubmit = async (values: TaskFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      if (!task) {
        reset();
      }
    } catch (error) {
      console.error("Failed to submit task form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Enter task title"
          {...register("title")}
          aria-invalid={!!errors.title}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter task description (optional)"
          rows={4}
          {...register("description")}
          aria-invalid={!!errors.description}
        />
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Assignee */}
      {assignees.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="assignee">Assignee</Label>
          <Select
            value={assigneeId || "unassigned"}
            onValueChange={(value) =>
              setValue(
                "assignee_id",
                value === "unassigned" ? undefined : value,
                { shouldValidate: true },
              )
            }
          >
            <SelectTrigger id="assignee">
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {assignees.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.clerk_user_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Date Range */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Start Date */}
        <div className="space-y-2">
          <Label htmlFor="start-date">
            Start Date <span className="text-destructive">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="start-date"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground",
                )}
                aria-invalid={!!errors.start_date}
              >
                <CalendarIcon className="mr-2" />
                {startDate ? (
                  format(startDate, "PPP")
                ) : (
                  <span>Pick a start date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) =>
                  setValue("start_date", date as Date, { shouldValidate: true })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.start_date && (
            <p className="text-sm text-destructive">
              {errors.start_date.message}
            </p>
          )}
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label htmlFor="end-date">
            End Date <span className="text-destructive">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="end-date"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground",
                )}
                aria-invalid={!!errors.end_date}
              >
                <CalendarIcon className="mr-2" />
                {endDate ? (
                  format(endDate, "PPP")
                ) : (
                  <span>Pick an end date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) =>
                  setValue("end_date", date as Date, { shouldValidate: true })
                }
                disabled={(date) => (startDate ? date < startDate : false)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.end_date && (
            <p className="text-sm text-destructive">
              {errors.end_date.message}
            </p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
