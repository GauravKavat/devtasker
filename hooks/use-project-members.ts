"use client";

import { useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";
import type { ProjectMemberWithUser } from "@/lib/supabase/types";

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

async function fetchProjectMembers(projectId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("project_members")
    .select(
      `
      *,
      user:users(*)
    `,
    )
    .eq("project_id", projectId)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  return (data as any[]) || [];
}

export function useProjectMembers(projectId: string) {
  const { user } = useUser();

  const query = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => fetchProjectMembers(projectId),
    enabled: !!projectId && !!user,
  });

  return {
    members: query.data || [],
    loading: query.isLoading,
    error: query.error,
  };
}

export function useUpdateMemberRole() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      memberId,
      role,
      projectId,
    }: {
      memberId: string;
      role: string;
      projectId: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const supabase = getSupabaseClient() as any;

      const { error } = await supabase
        .from("project_members")
        .update({ role })
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["project-members", variables.projectId],
      });
    },
  });

  return useCallback(
    async (memberId: string, role: string, projectId: string) => {
      await mutation.mutateAsync({ memberId, role, projectId });
    },
    [mutation],
  );
}

export function useRemoveMember() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      memberId,
      projectId,
    }: {
      memberId: string;
      projectId: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const supabase = getSupabaseClient() as any;

      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["project-members", variables.projectId],
      });
    },
  });

  return useCallback(
    async (memberId: string, projectId: string) => {
      await mutation.mutateAsync({ memberId, projectId });
    },
    [mutation],
  );
}
