"use client";

import { useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";
import type { Task, Column, TaskWithAssignee } from "@/lib/supabase/types";

async function fetchKanbanData(projectId: string) {
  const supabase = getSupabaseClient();

  // Fetch columns
  const { data: columnsData, error: columnsError } = await supabase
    .from("columns")
    .select("*")
    .eq("project_id", projectId)
    .order("position");

  if (columnsError) throw columnsError;

  const columnIds = (columnsData as Column[] | null)?.map((c) => c.id) || [];

  // Fetch tasks with assignee info
  const { data: tasksData, error: tasksError } = await supabase
    .from("tasks")
    .select(
      `
        *,
        assignee:users!assignee_id(*)
      `,
    )
    .in("column_id", columnIds)
    .order("position");

  if (tasksError) throw tasksError;

  // Combine columns with their tasks
  const columnsWithTasks = (columnsData as Column[] | null)?.map((column) => ({
    ...column,
    tasks:
      (tasksData as TaskWithAssignee[] | null)?.filter(
        (task) => task.column_id === column.id,
      ) || [],
  }));

  return columnsWithTasks || [];
}

export function useKanban(projectId: string) {
  const queryClient = useQueryClient();

  const {
    data: columns = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["kanban", projectId],
    queryFn: () => fetchKanbanData(projectId),
    enabled: !!projectId,
    staleTime: 20 * 1000, // 20 seconds
  });

  // Real-time subscription
  useEffect(() => {
    if (!projectId) return;

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`project-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "columns" },
        () =>
          queryClient.invalidateQueries({ queryKey: ["kanban", projectId] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () =>
          queryClient.invalidateQueries({ queryKey: ["kanban", projectId] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["kanban", projectId] });
  }, [projectId, queryClient]);

  return {
    columns,
    loading,
    error: error as Error | null,
    refetch,
  };
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      columnId,
      task,
    }: {
      columnId: string;
      task: Partial<Task>;
    }) => {
      const supabase = getSupabaseClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban"] });
    },
  });

  return useCallback(
    (columnId: string, task: Partial<Task>) =>
      mutation.mutateAsync({ columnId, task }),
    [mutation],
  );
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: Partial<Task>;
    }) => {
      const supabase = getSupabaseClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban"] });
    },
  });

  return useCallback(
    (taskId: string, updates: Partial<Task>) =>
      mutation.mutateAsync({ taskId, updates }),
    [mutation],
  );
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (taskId: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban"] });
    },
  });

  return useCallback(
    (taskId: string) => mutation.mutateAsync(taskId),
    [mutation],
  );
}

export function useMoveTask() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      taskId,
      newColumnId,
      newPosition,
    }: {
      taskId: string;
      newColumnId: string;
      newPosition: number;
    }) => {
      const supabase = getSupabaseClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban"] });
    },
  });

  return useCallback(
    (taskId: string, newColumnId: string, newPosition: number) =>
      mutation.mutateAsync({ taskId, newColumnId, newPosition }),
    [mutation],
  );
}
