"use client";

import { useGitHubActions } from "@/hooks/use-github";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, CheckCircle2, XCircle, Clock, ExternalLink, GitBranch } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface GitHubActionsStatusProps {
  repoOwner: string;
  repoName: string;
}

export function GitHubActionsStatus({ repoOwner, repoName }: GitHubActionsStatusProps) {
  const { data, isLoading, error } = useGitHubActions(repoOwner, repoName);

  const getStatusIcon = (status: string, conclusion: string | null) => {
    if (status === "completed") {
      if (conclusion === "success") {
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      } else if (conclusion === "failure") {
        return <XCircle className="h-4 w-4 text-red-500" />;
      } else if (conclusion === "cancelled") {
        return <XCircle className="h-4 w-4 text-gray-500" />;
      }
    }
    return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
  };

  const getStatusBadge = (status: string, conclusion: string | null) => {
    if (status === "completed") {
      if (conclusion === "success") {
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      } else if (conclusion === "failure") {
        return <Badge variant="destructive">Failed</Badge>;
      } else if (conclusion === "cancelled") {
        return <Badge variant="outline">Cancelled</Badge>;
      }
    } else if (status === "in_progress") {
      return <Badge variant="secondary">In Progress</Badge>;
    } else if (status === "queued") {
      return <Badge variant="outline">Queued</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          GitHub Actions
        </CardTitle>
        <CardDescription>
          Recent workflow runs for {repoOwner}/{repoName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Failed to load workflow runs</p>
          </div>
        ) : !data?.workflows || data.workflows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No workflow runs found</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {data.workflows.map((workflow) => (
                <a
                  key={workflow.id}
                  href={workflow.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {getStatusIcon(workflow.status, workflow.conclusion)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">
                            {workflow.name}
                          </span>
                          {getStatusBadge(workflow.status, workflow.conclusion)}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <GitBranch className="h-3 w-3" />
                          <span className="truncate">{workflow.branch}</span>
                          <span>•</span>
                          <span>{workflow.event}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={workflow.actor.avatar_url} />
                            <AvatarFallback>{workflow.actor.login[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {workflow.actor.login}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(workflow.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </a>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
