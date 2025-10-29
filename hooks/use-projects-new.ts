"use client";

import { useCallback, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";
import type { Project } from "@/lib/supabase/types";

// Ensure or create user in database
async function ensureUser(clerkUserId: string) {
  const supabase = getSupabaseClient();

  let { data: dbUser } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (!dbUser) {
    const { data: newUser } = await supabase
      .from("users")
      .insert({ clerk_user_id: clerkUserId } as any)
      .select("id")
      .single();
    dbUser = newUser;
  }

  return dbUser;
}

// Fetch projects function
async function fetchProjects(userId: string) {
  const supabase = getSupabaseClient();
  const dbUser = await ensureUser(userId);

  if (!dbUser) throw new Error("Failed to get user");

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", (dbUser as any).id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Project[]) || [];
}

export function useProjects() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const {
    data: projects = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["projects", user?.id],
    queryFn: () => fetchProjects(user!.id),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!user?.id) return;

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel("projects-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["projects", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return {
    projects,
    loading,
    error: error as Error | null,
    refetch: () =>
      queryClient.invalidateQueries({ queryKey: ["projects", user?.id] }),
  };
}

export function useCreateProject() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const supabase = getSupabaseClient();
      const dbUser = await ensureUser(user.id);

      if (!dbUser) throw new Error("Failed to create user");

      const { data, error } = await supabase
        .from("projects")
        .insert({
          name,
          description: description || null,
          owner_id: (dbUser as any).id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("Failed to create project");

      const defaultColumns = [
        { name: "Backlog", position: 0, color: "#94a3b8" },
        { name: "To Do", position: 1, color: "#60a5fa" },
        { name: "In Progress", position: 2, color: "#fbbf24" },
        { name: "Done", position: 3, color: "#34d399" },
      ];

      await supabase.from("columns").insert(
        defaultColumns.map((col) => ({
          ...col,
          project_id: (data as any).id,
        })) as any
      );

      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", user?.id] });
    },
  });

  return useCallback(
    (name: string, description?: string) =>
      mutation.mutateAsync({ name, description }),
    [mutation]
  );
}

export function useDeleteProject() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (projectId: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", user?.id] });
    },
  });

  return useCallback(
    (projectId: string) => mutation.mutateAsync(projectId),
    [mutation]
  );
}

export function useUpdateProject() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      projectId,
      updates,
    }: {
      projectId: string;
      updates: { name?: string; description?: string };
    }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("projects")
        // @ts-expect-error - Supabase type inference issue with Database schema
        .update(updates as any)
        .eq("id", projectId)
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", user?.id] });
    },
  });

  return useCallback(
    (projectId: string, updates: { name?: string; description?: string }) =>
      mutation.mutateAsync({ projectId, updates }),
    [mutation]
  );
}
