"use client";

import { useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";

async function fetchProjectMembers(projectId: string) {
  if (!projectId) {
    console.log("No projectId provided, skipping fetch");
    return [];
  }

  console.log("Fetching members for project:", projectId);

  try {
    const response = await fetch(`/api/projects/${projectId}/members`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      throw new Error(errorData.error || "Failed to fetch members");
    }

    const data = await response.json();
    console.log("Fetched members from API:", data);
    return data.members || [];
  } catch (error) {
    console.error("Error fetching members:", error);
    throw error;
  }
}

export function useProjectMembers(projectId: string) {
  const { user } = useUser();
  const isEnabled = !!projectId && projectId !== "" && !!user;

  console.log("useProjectMembers hook:", {
    projectId,
    hasUser: !!user,
    isEnabled,
  });

  const query = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => fetchProjectMembers(projectId),
    enabled: isEnabled,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch when component mounts
  });

  return {
    members: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
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

      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update role");
      }
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
