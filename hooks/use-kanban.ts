"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  ColumnWithTasks,
  Task,
  Column,
  TaskWithAssignee,
} from "@/lib/supabase/types";

export function useKanban(projectId: string) {
  const [columns, setColumns] = useState<ColumnWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchKanbanData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch columns
      const { data: columnsData, error: columnsError } = await supabase
        .from("columns")
        .select("*")
        .eq("project_id", projectId)
        .order("position");

      if (columnsError) throw columnsError;

      const columnIds =
        (columnsData as Column[] | null)?.map((c) => c.id) || [];

      // Fetch tasks with assignee info
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(
          `
          *,
          assignee:users(*)
        `,
        )
        .in("column_id", columnIds)
        .order("position");

      if (tasksError) throw tasksError;

      // Combine columns with their tasks
      const columnsWithTasks = (columnsData as Column[] | null)?.map(
        (column) => ({
          ...column,
          tasks:
            (tasksData as TaskWithAssignee[] | null)?.filter(
              (task) => task.column_id === column.id,
            ) || [],
        }),
      );

      setColumns(columnsWithTasks || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching kanban data:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, supabase]);

  useEffect(() => {
    fetchKanbanData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`project-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "columns" },
        () => fetchKanbanData(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => fetchKanbanData(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchKanbanData, projectId, supabase]);

  return { columns, loading, error, refetch: fetchKanbanData };
}

export function useCreateTask() {
  const supabase = createClient();

  return useCallback(
    async (columnId: string, task: Partial<Task>) => {
      // Get the next position
      const { data: tasks } = await supabase
        .from("tasks")
        .select("position")
        .eq("column_id", columnId)
        .order("position", { ascending: false })
        .limit(1);

      const nextPosition =
        tasks && tasks.length > 0 ? (tasks[0] as any).position + 1 : 0;

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          ...task,
          column_id: columnId,
          position: nextPosition,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    [supabase],
  );
}

export function useUpdateTask() {
  const supabase = createClient();

  return useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      const { data, error } = await supabase
        .from("tasks")
        // @ts-expect-error - Supabase type inference issue with Database schema
        .update(updates as any)
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    [supabase],
  );
}

export function useDeleteTask() {
  const supabase = createClient();

  return useCallback(
    async (taskId: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    [supabase],
  );
}

export function useMoveTask() {
  const supabase = createClient();

  return useCallback(
    async (taskId: string, newColumnId: string, newPosition: number) => {
      // Move the task
      const { error } = await supabase
        .from("tasks")
        // @ts-expect-error - Supabase type inference issue with Database schema
        .update({
          column_id: newColumnId,
          position: newPosition,
        } as any)
        .eq("id", taskId);

      if (error) throw error;
    },
    [supabase],
  );
}
