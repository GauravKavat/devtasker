"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectRepos } from "@/components/github";
import { GitHubActionsStatus } from "@/components/github";
import { useProjectRepos } from "@/hooks/use-github";
import { useProjects } from "@/hooks/use-projects";

interface GithubReposProps {
  projectId: string;
}

export default function GithubRepos({ projectId }: GithubReposProps) {
  const { projects, loading } = useProjects();
  const project = projects.find((p) => p.id === projectId);
  const { data: repos } = useProjectRepos(projectId);
  const [selectedRepo, setSelectedRepo] = useState("");

  const selectedRepoData = repos?.find((r) => r.id === selectedRepo);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Linked Repositories</h1>
        {projectId && (
          <p className="text-muted-foreground mt-2">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading project...
              </span>
            ) : project ? (
              <>Manage linked repositories for: {project.name}</>
            ) : (
              <>Manage linked repositories for project: {projectId}</>
            )}
          </p>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Repositories</CardTitle>
            <CardDescription>
              Link GitHub repositories to this project for issue tracking,
              branch management, and CI/CD integration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectRepos projectId={projectId} />
          </CardContent>
        </Card>

        {repos && repos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>CI/CD Status</CardTitle>
              <CardDescription>
                Monitor GitHub Actions workflows for your linked repositories.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium whitespace-nowrap">
                  Select Repository:
                </label>
                <select
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Choose a repository...</option>
                  {repos.map((repo) => (
                    <option key={repo.id} value={repo.id}>
                      {repo.repo_owner}/{repo.repo_name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRepoData && (
                <GitHubActionsStatus
                  repoOwner={selectedRepoData.repo_owner}
                  repoName={selectedRepoData.repo_name}
                  projectId={projectId}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
