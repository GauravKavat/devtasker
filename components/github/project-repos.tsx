"use client";

import { useState } from "react";
import {
  useGitHubIntegration,
  useGitHubWebhooks,
  useCreateWebhook,
  useDeleteWebhook,
} from "@/hooks/use-github";
import { useProjectRole } from "@/hooks/use-project-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  GitBranch,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProjectReposProps {
  projectId: string;
}

export function ProjectRepos({ projectId }: ProjectReposProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [repoToDelete, setRepoToDelete] = useState<string | null>(null);
  const [webhookRepoId, setWebhookRepoId] = useState("");
  const { repos, isLoading, error, addRepo, deleteRepo } =
    useGitHubIntegration(projectId);
  const selectedWebhookRepo = repos.find((repo) => repo.id === webhookRepoId);
  const { data: webhooks } = useGitHubWebhooks(
    projectId,
    selectedWebhookRepo?.repo_owner,
    selectedWebhookRepo?.repo_name,
  );
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const { isAdmin } = useProjectRole(projectId);

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsAdding(true);
    try {
      await addRepo(repoUrl.trim());
      setRepoUrl("");
    } catch (err) {
      // Error is handled by the hook
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!repoToDelete) return;
    await deleteRepo(repoToDelete);
    setRepoToDelete(null);
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Linked Repositories
        </CardTitle>
        <CardDescription>
          {isAdmin
            ? "Connect GitHub repositories to this project for seamless integration"
            : "View GitHub repositories linked to this project"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdmin && (
          <form onSubmit={handleAddRepo} className="flex gap-2">
            <Input
              type="text"
              placeholder="https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={isAdding}
            />
            <Button type="submit" disabled={isAdding || !repoUrl.trim()}>
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </>
              )}
            </Button>
          </form>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : repos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No repositories linked yet
          </div>
        ) : (
          <div className="space-y-2">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {repo.repo_owner}/{repo.repo_name}
                    </span>
                    {repo.default_branch && (
                      <Badge variant="outline" className="text-xs">
                        {repo.default_branch}
                      </Badge>
                    )}
                  </div>
                  <a
                    href={repo.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mt-1"
                  >
                    {repo.repo_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Remove Repository
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <span className="block">
                            Are you sure you want to remove{" "}
                            <span className="font-semibold text-foreground">
                              {repo.repo_owner}/{repo.repo_name}
                            </span>{" "}
                            from this project?
                          </span>
                          <span className="block text-sm">
                            This will disconnect the repository from your
                            project. All linked tasks and integrations will be
                            affected.
                          </span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            setRepoToDelete(repo.id);
                            handleDeleteConfirm();
                          }}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          Remove Repository
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        )}

        {isAdmin && repos.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">GitHub Webhooks</h4>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={webhookRepoId}
                onChange={(e) => setWebhookRepoId(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Choose repository...</option>
                {repos.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.repo_owner}/{repo.repo_name}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                disabled={!selectedWebhookRepo || createWebhook.isPending}
                onClick={() => {
                  if (!selectedWebhookRepo) return;
                  createWebhook.mutate({
                    projectId,
                    repoOwner: selectedWebhookRepo.repo_owner,
                    repoName: selectedWebhookRepo.repo_name,
                  });
                }}
              >
                {createWebhook.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create Webhook"
                )}
              </Button>
            </div>

            {selectedWebhookRepo ? (
              webhooks && webhooks.length > 0 ? (
                <div className="space-y-2">
                  {webhooks.map((webhook) => (
                    <div
                      key={webhook.id}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      <div className="text-xs text-muted-foreground break-all">
                        {webhook.webhook_url}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deleteWebhook.isPending}
                        onClick={() => {
                          deleteWebhook.mutate({
                            projectId,
                            repoOwner: selectedWebhookRepo.repo_owner,
                            repoName: selectedWebhookRepo.repo_name,
                            webhookId: webhook.webhook_id,
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No webhooks created yet.</p>
              )
            ) : (
              <p className="text-xs text-muted-foreground">Select a repository to view webhooks.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
