"use client";

import { useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RoleDefinition } from "@/lib/roles";

async function fetchProjectRoles(projectId: string) {
  const response = await fetch(`/api/projects/${projectId}/roles`);

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to fetch roles");
  }

  const data = await response.json();
  return (data.roles || []) as RoleDefinition[];
}

export function useProjectRoles(projectId: string) {
  const { user } = useUser();

  const query = useQuery({
    queryKey: ["project-roles", projectId],
    queryFn: () => fetchProjectRoles(projectId),
    enabled: !!projectId && !!user,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return {
    roles: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateProjectRole() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      projectId,
      name,
      permissions,
    }: {
      projectId: string;
      name: string;
      permissions: string[];
    }) => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(`/api/projects/${projectId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, permissions }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create role");
      }

      return response.json();
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["project-roles", variables.projectId],
      });
    },
  });

  return useCallback(
    async (projectId: string, name: string, permissions: string[]) => {
      return mutation.mutateAsync({ projectId, name, permissions });
    },
    [mutation],
  );
}

export function useUpdateProjectRole() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      projectId,
      roleId,
      permissions,
    }: {
      projectId: string;
      roleId: string;
      permissions: string[];
    }) => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(`/api/projects/${projectId}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId, permissions }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update role");
      }

      return response.json();
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["project-roles", variables.projectId],
      });
    },
  });

  return useCallback(
    async (projectId: string, roleId: string, permissions: string[]) => {
      return mutation.mutateAsync({ projectId, roleId, permissions });
    },
    [mutation],
  );
}

export function useDeleteProjectRole() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      projectId,
      roleId,
    }: {
      projectId: string;
      roleId: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const response = await fetch(`/api/projects/${projectId}/roles`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete role");
      }

      return response.json();
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["project-roles", variables.projectId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["project-members", variables.projectId],
      });
    },
  });

  return useCallback(
    async (projectId: string, roleId: string) => {
      return mutation.mutateAsync({ projectId, roleId });
    },
    [mutation],
  );
}
