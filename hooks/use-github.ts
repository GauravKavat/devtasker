"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProjectRepo, TaskGitHubLink } from "@/lib/supabase/types";

interface GitHubWorkflow {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  branch: string;
  event: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  actor: {
    login: string;
    avatar_url: string;
  };
}

export function useProjectRepos(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-repos", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await fetch(`/api/github/repos?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch repositories");
      const data = await res.json();
      return data.repos as ProjectRepo[];
    },
    enabled: !!projectId,
  });
}

export function useAddProjectRepo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, repoUrl }: { projectId: string; repoUrl: string }) => {
      const res = await fetch("/api/github/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, repoUrl }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add repository");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-repos", variables.projectId] });
    },
  });
}

export function useDeleteProjectRepo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ repoId, projectId }: { repoId: string; projectId: string }) => {
      const res = await fetch(`/api/github/repos?repoId=${repoId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete repository");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-repos", variables.projectId] });
    },
  });
}

export function useTaskGitHubLinks(taskId: string | undefined) {
  return useQuery({
    queryKey: ["task-github-links", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const res = await fetch(`/api/github/tasks?taskId=${taskId}`);
      if (!res.ok) throw new Error("Failed to fetch GitHub links");
      const data = await res.json();
      return data.links as TaskGitHubLink[];
    },
    enabled: !!taskId,
  });
}

export function useTaskCommits(taskId: string | undefined) {
  return useQuery({
    queryKey: ["task-commits", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const res = await fetch(`/api/tasks/${taskId}/commits`);
      if (!res.ok) throw new Error("Failed to fetch commits");
      const data = await res.json();
      return data.commits as { id: string; commit_sha: string; commit_message: string; commit_url: string; author: string; committed_at: string }[];
    },
    enabled: !!taskId,
  });
}

export function useLinkTaskToGitHub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      linkType,
      githubUrl,
      projectId,
    }: {
      taskId: string;
      linkType: "issue" | "pr" | "commit";
      githubUrl: string;
      projectId?: string;
    }) => {
      const res = await fetch("/api/github/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, linkType, githubUrl, projectId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to link task");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task-github-links", variables.taskId] });
    },
  });
}

export function useDeleteTaskGitHubLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId, taskId }: { linkId: string; taskId: string }) => {
      const res = await fetch(`/api/github/tasks?linkId=${linkId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete link");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task-github-links", variables.taskId] });
    },
  });
}

export function useImportGitHubIssues() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      columnId,
      repoOwner,
      repoName,
      issueNumbers,
    }: {
      projectId: string;
      columnId: string;
      repoOwner: string;
      repoName: string;
      issueNumbers?: number[];
    }) => {
      const res = await fetch("/api/github/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, columnId, repoOwner, repoName, issueNumbers }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to import issues");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useCreateBranch() {
  return useMutation({
    mutationFn: async ({
      taskId,
      repoOwner,
      repoName,
      branchName,
      baseBranch,
    }: {
      taskId: string;
      repoOwner: string;
      repoName: string;
      branchName: string;
      baseBranch?: string;
    }) => {
      const res = await fetch("/api/github/branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, repoOwner, repoName, branchName, baseBranch }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create branch");
      }
      return res.json();
    },
  });
}

export function useGitHubActions(
  repoOwner: string | undefined,
  repoName: string | undefined,
  projectId: string | undefined,
) {
  return useQuery({
    queryKey: ["github-actions", repoOwner, repoName, projectId],
    queryFn: async () => {
      if (!repoOwner || !repoName || !projectId) {
        return { workflows: [], total_count: 0 };
      }
      const res = await fetch(
        `/api/github/actions?repoOwner=${repoOwner}&repoName=${repoName}&projectId=${projectId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch GitHub Actions");
      return res.json() as Promise<{ workflows: GitHubWorkflow[]; total_count: number }>;
    },
    enabled: !!repoOwner && !!repoName && !!projectId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useGitHubWebhooks(
  projectId: string | undefined,
  repoOwner?: string,
  repoName?: string,
) {
  return useQuery({
    queryKey: ["github-webhooks", projectId, repoOwner, repoName],
    queryFn: async () => {
      if (!projectId) return [];
      const params = new URLSearchParams({ projectId });
      if (repoOwner && repoName) {
        params.set("repoOwner", repoOwner);
        params.set("repoName", repoName);
      }
      const res = await fetch(`/api/github/webhook?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch webhooks");
      const data = await res.json();
      return data.webhooks as { id: string; webhook_id: string; webhook_url: string; active: boolean }[];
    },
    enabled: !!projectId,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      repoOwner,
      repoName,
    }: {
      projectId: string;
      repoOwner: string;
      repoName: string;
    }) => {
      const res = await fetch("/api/github/webhook", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, repoOwner, repoName }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create webhook");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["github-webhooks", variables.projectId] });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      repoOwner,
      repoName,
      webhookId,
    }: {
      projectId: string;
      repoOwner: string;
      repoName: string;
      webhookId: string;
    }) => {
      const res = await fetch(
        `/api/github/webhook?projectId=${projectId}&repoOwner=${repoOwner}&repoName=${repoName}&webhookId=${webhookId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete webhook");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["github-webhooks", variables.projectId] });
    },
  });
}

export function useGitHubIntegration(projectId?: string) {
  const [error, setError] = useState<string | null>(null);

  const repos = useProjectRepos(projectId);
  const addRepo = useAddProjectRepo();
  const deleteRepo = useDeleteProjectRepo();
  const importIssues = useImportGitHubIssues();
  const createBranch = useCreateBranch();

  const handleAddRepo = useCallback(
    async (repoUrl: string) => {
      if (!projectId) {
        setError("No project selected");
        return;
      }
      try {
        setError(null);
        await addRepo.mutateAsync({ projectId, repoUrl });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add repository");
        throw err;
      }
    },
    [projectId, addRepo]
  );

  const handleDeleteRepo = useCallback(
    async (repoId: string) => {
      if (!projectId) return;
      try {
        setError(null);
        await deleteRepo.mutateAsync({ repoId, projectId });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete repository");
        throw err;
      }
    },
    [projectId, deleteRepo]
  );

  const handleImportIssues = useCallback(
    async (columnId: string, repoOwner: string, repoName: string, issueNumbers?: number[]) => {
      if (!projectId) {
        setError("No project selected");
        return;
      }
      try {
        setError(null);
        return await importIssues.mutateAsync({
          projectId,
          columnId,
          repoOwner,
          repoName,
          issueNumbers,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to import issues");
        throw err;
      }
    },
    [projectId, importIssues]
  );

  const handleCreateBranch = useCallback(
    async (taskId: string, repoOwner: string, repoName: string, branchName: string, baseBranch?: string) => {
      try {
        setError(null);
        return await createBranch.mutateAsync({ taskId, repoOwner, repoName, branchName, baseBranch });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create branch");
        throw err;
      }
    },
    [createBranch]
  );

  return {
    repos: repos.data || [],
    isLoading: repos.isLoading,
    error,
    addRepo: handleAddRepo,
    deleteRepo: handleDeleteRepo,
    importIssues: handleImportIssues,
    createBranch: handleCreateBranch,
  };
}
