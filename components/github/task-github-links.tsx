"use client";

import { useState } from "react";
import {
  useTaskGitHubLinks,
  useLinkTaskToGitHub,
  useDeleteTaskGitHubLink,
  useTaskCommits,
} from "@/hooks/use-github";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  GitPullRequest,
  GitCommit,
  AlertCircle,
  ExternalLink,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface TaskGitHubLinksProps {
  taskId: string;
  compact?: boolean;
}

export function TaskGitHubLinks({
  taskId,
  compact = false,
}: TaskGitHubLinksProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [linkType, setLinkType] = useState<"issue" | "pr" | "commit">("pr");
  const [githubUrl, setGithubUrl] = useState("");

  const { data: links, isLoading } = useTaskGitHubLinks(taskId);
  const { data: commits } = useTaskCommits(taskId);
  const linkMutation = useLinkTaskToGitHub();
  const deleteMutation = useDeleteTaskGitHubLink();

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;

    try {
      await linkMutation.mutateAsync({
        taskId,
        linkType,
        githubUrl: githubUrl.trim(),
      });
      setGithubUrl("");
      setIsOpen(false);
    } catch (err) {
      // Error handled by mutation
    }
  };

  const handleDelete = async (linkId: string) => {
    await deleteMutation.mutateAsync({ linkId, taskId });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "pr":
        return <GitPullRequest className="h-3 w-3" />;
      case "issue":
        return <AlertCircle className="h-3 w-3" />;
      case "commit":
        return <GitCommit className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (
    status: string | null,
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (!status) return "outline";
    if (status === "merged") return "default";
    if (status === "open") return "secondary";
    if (status === "closed") return "outline";
    return "outline";
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasLinks = links && links.length > 0;

  if (compact) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {hasLinks &&
          links.map((link) => (
            <a
              key={link.id}
              href={link.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
            >
              <Badge
                variant={getStatusVariant(link.status)}
                className="text-xs gap-1"
              >
                {getIcon(link.link_type)}
                {link.link_type === "commit"
                  ? link.github_id.substring(0, 7)
                  : `#${link.github_number}`}
              </Badge>
            </a>
          ))}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <form onSubmit={handleAddLink} className="space-y-4">
              <div className="space-y-2">
                <Label>Link Type</Label>
                <select
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value as any)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="pr">Pull Request</option>
                  <option value="issue">Issue</option>
                  <option value="commit">Commit</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>GitHub URL</Label>
                <Input
                  type="text"
                  placeholder="https://github.com/..."
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={linkMutation.isPending}
              >
                {linkMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Linking...
                  </>
                ) : (
                  "Add Link"
                )}
              </Button>
            </form>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  const recentCommits = (commits || []).slice(0, 3);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">GitHub Links</h4>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <form onSubmit={handleAddLink} className="space-y-4">
              <div className="space-y-2">
                <Label>Link Type</Label>
                <select
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value as any)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="pr">Pull Request</option>
                  <option value="issue">Issue</option>
                  <option value="commit">Commit</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>GitHub URL</Label>
                <Input
                  type="text"
                  placeholder="https://github.com/owner/repo/pull/123"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={linkMutation.isPending}
              >
                {linkMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Linking...
                  </>
                ) : (
                  "Add Link"
                )}
              </Button>
            </form>
          </PopoverContent>
        </Popover>
      </div>

      {hasLinks ? (
        <div className="space-y-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between p-2 border rounded-md hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1">
                {getIcon(link.link_type)}
                <a
                  href={link.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline inline-flex items-center gap-1"
                >
                  {link.link_type === "commit"
                    ? `Commit ${link.github_id.substring(0, 7)}`
                    : `${link.link_type === "pr" ? "PR" : "Issue"} #${link.github_number}`}
                  <ExternalLink className="h-3 w-3" />
                </a>
                {link.status && (
                  <Badge
                    variant={getStatusVariant(link.status)}
                    className="text-xs"
                  >
                    {link.status}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleDelete(link.id)}
                disabled={deleteMutation.isPending}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No GitHub links yet</p>
      )}

      {recentCommits.length > 0 && (
        <div className="space-y-1 pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground">Recent commits</p>
          {recentCommits.map((commit) => (
            <a
              key={commit.id}
              href={commit.commit_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-2"
            >
              <span className="font-mono">
                {commit.commit_sha.substring(0, 7)}
              </span>
              <span className="truncate max-w-[320px]">{commit.commit_message}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
