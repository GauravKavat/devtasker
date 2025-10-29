"use client";

import { useState } from "react";
import { Loader2, GitBranch, GitCommit, Tag, GitPullRequest, ExternalLink, Calendar, GitMerge, AlertCircle, Star, Eye, GitFork } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import type { GitHubCommit, GitHubBranch, GitHubRelease, GitHubPullRequest, GitHubRepoInfo } from "@/lib/github-types";

interface GithubUrlProps {
  projectId?: string;
}

export default function GithubUrl({ projectId }: GithubUrlProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [fetchedRepoUrl, setFetchedRepoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [repoInfo, setRepoInfo] = useState<GitHubRepoInfo | null>(null);

  const fetchGitHubData = async () => {
    if (!repoUrl.trim()) {
      setError("Please enter a GitHub repository URL");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          action: "all",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch GitHub data");
      }

      const data = await response.json();
      setCommits(data.commits || []);
      setBranches(data.branches || []);
      setReleases(data.releases || []);
      setPullRequests(data.pullRequests || []);
      setRepoInfo(data.repoInfo);
      setFetchedRepoUrl(repoUrl);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setCommits([]);
      setBranches([]);
      setReleases([]);
      setPullRequests([]);
      setRepoInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGitHubData();
  };

  // Build commit tree structure
  const buildCommitTree = () => {
    const commitMap = new Map(commits.map((c) => [c.sha, c]));
    return commits.map((commit) => ({
      ...commit,
      children: commit.parents.map((p) => commitMap.get(p.sha)).filter(Boolean) as GitHubCommit[],
    }));
  };

  const commitTree = buildCommitTree();

  // Identify potential merge conflicts (PRs with mergeable_state issues)
  const conflictingPRs = pullRequests.filter(
    (pr) => pr.state === "open" && pr.mergeable_state && ["dirty", "unstable", "blocked"].includes(pr.mergeable_state)
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Repository URL</h1>
        <p className="text-muted-foreground mt-2">
          Enter a GitHub repository URL to view VCS information (commits, branches, releases, pull requests)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fetch Repository Data</CardTitle>
          <CardDescription>
            Provide a GitHub repository URL to analyze its version control information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="https://github.com/username/repository"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Fetch Data"
              )}
            </Button>
          </form>
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {repoInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{repoInfo.full_name}</span>
              <a
                href={repoInfo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                View on GitHub <ExternalLink className="h-3 w-3" />
              </a>
            </CardTitle>
            <CardDescription>{repoInfo.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>{repoInfo.stargazers_count} stars</span>
              </div>
              <div className="flex items-center gap-2">
                <GitFork className="h-4 w-4" />
                <span>{repoInfo.forks_count} forks</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{repoInfo.watchers_count} watchers</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{repoInfo.open_issues_count} issues</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {fetchedRepoUrl && !error && (
        <Tabs defaultValue="commits" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="commits">
              <GitCommit className="h-4 w-4 mr-2" />
              Commits
            </TabsTrigger>
            <TabsTrigger value="branches">
              <GitBranch className="h-4 w-4 mr-2" />
              Branches
            </TabsTrigger>
            <TabsTrigger value="releases">
              <Tag className="h-4 w-4 mr-2" />
              Releases
            </TabsTrigger>
            <TabsTrigger value="pullRequests">
              <GitPullRequest className="h-4 w-4 mr-2" />
              Pull Requests
            </TabsTrigger>
            <TabsTrigger value="tree">
              <GitMerge className="h-4 w-4 mr-2" />
              Commit Tree
            </TabsTrigger>
          </TabsList>

          <TabsContent value="commits">
            <Card>
              <CardHeader>
                <CardTitle>Commit History ({commits.length})</CardTitle>
                <CardDescription>Latest 50 commits to the repository</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {commits.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No commits found</p>
                  ) : (
                    <div className="space-y-4">
                      {commits.map((commit) => (
                        <div key={commit.sha} className="flex gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                          <Avatar>
                            <AvatarImage src={commit.author?.avatar_url} alt={commit.commit.author.name} />
                            <AvatarFallback>
                              {commit.commit.author.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{commit.commit.message.split("\n")[0]}</p>
                                <p className="text-sm text-muted-foreground">
                                  {commit.commit.author.name} committed{" "}
                                  {formatDistanceToNow(new Date(commit.commit.author.date), { addSuffix: true })}
                                </p>
                              </div>
                              <a
                                href={commit.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline font-mono"
                              >
                                {commit.sha.substring(0, 7)}
                              </a>
                            </div>
                            {commit.parents.length > 1 && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <GitMerge className="h-3 w-3" />
                                Merge commit ({commit.parents.length} parents)
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branches">
            <Card>
              <CardHeader>
                <CardTitle>Branches ({branches.length})</CardTitle>
                <CardDescription>All branches in the repository</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {branches.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No branches found</p>
                  ) : (
                    <div className="space-y-2">
                      {branches.map((branch) => (
                        <div key={branch.name} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <GitBranch className="h-4 w-4" />
                            <span className="font-medium">{branch.name}</span>
                            {branch.protected && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Protected</span>
                            )}
                          </div>
                          <a
                            href={`https://github.com/${fetchedRepoUrl.split("github.com/")[1]}/tree/${branch.name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline font-mono"
                          >
                            {branch.commit.sha.substring(0, 7)}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="releases">
            <Card>
              <CardHeader>
                <CardTitle>Releases ({releases.length})</CardTitle>
                <CardDescription>Published releases and tags</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {releases.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No releases found</p>
                  ) : (
                    <div className="space-y-4">
                      {releases.map((release) => (
                        <div key={release.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Tag className="h-4 w-4" />
                              <div>
                                <h4 className="font-semibold">{release.name || release.tag_name}</h4>
                                <p className="text-sm text-muted-foreground">{release.tag_name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {release.prerelease && (
                                <span className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 px-2 py-1 rounded">
                                  Pre-release
                                </span>
                              )}
                              {release.draft && (
                                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">Draft</span>
                              )}
                            </div>
                          </div>
                          {release.body && (
                            <p className="text-sm text-muted-foreground line-clamp-3">{release.body}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              Released {formatDistanceToNow(new Date(release.published_at), { addSuffix: true })}
                            </div>
                            <a
                              href={release.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                              View release <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pullRequests">
            <Card>
              <CardHeader>
                <CardTitle>Pull Requests ({pullRequests.length})</CardTitle>
                <CardDescription>Open and closed pull requests</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {pullRequests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No pull requests found</p>
                  ) : (
                    <div className="space-y-4">
                      {conflictingPRs.length > 0 && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 font-medium mb-2">
                            <AlertCircle className="h-4 w-4" />
                            Potential Merge Issues ({conflictingPRs.length})
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Some pull requests have merge conflicts or other blocking issues
                          </p>
                        </div>
                      )}
                      {pullRequests.map((pr) => (
                        <div key={pr.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <GitPullRequest className="h-4 w-4" />
                                <h4 className="font-semibold">#{pr.number} {pr.title}</h4>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {pr.user.login} wants to merge {pr.head.ref} into {pr.base.ref}
                              </p>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                pr.state === "open"
                                  ? "bg-green-500/10 text-green-600 dark:text-green-500"
                                  : pr.merged_at
                                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-500"
                                  : "bg-red-500/10 text-red-600 dark:text-red-500"
                              }`}
                            >
                              {pr.state === "open" ? "Open" : pr.merged_at ? "Merged" : "Closed"}
                            </span>
                          </div>
                          {pr.body && <p className="text-sm text-muted-foreground line-clamp-2">{pr.body}</p>}
                          {pr.mergeable_state && ["dirty", "unstable", "blocked"].includes(pr.mergeable_state) && (
                            <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-500">
                              <AlertCircle className="h-3 w-3" />
                              Merge status: {pr.mergeable_state}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {pr.state === "open"
                                ? `Opened ${formatDistanceToNow(new Date(pr.created_at), { addSuffix: true })}`
                                : pr.merged_at
                                ? `Merged ${formatDistanceToNow(new Date(pr.merged_at), { addSuffix: true })}`
                                : `Closed ${formatDistanceToNow(new Date(pr.closed_at!), { addSuffix: true })}`}
                            </div>
                            <a
                              href={pr.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                              View PR <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tree">
            <Card>
              <CardHeader>
                <CardTitle>Commit Tree</CardTitle>
                <CardDescription>Visual representation of commit relationships</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {commitTree.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No commits to display</p>
                  ) : (
                    <div className="space-y-2">
                      {commitTree.map((commit, index) => (
                        <div key={commit.sha} className="flex gap-3 items-start">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                commit.parents.length > 1 ? "bg-purple-500" : "bg-primary"
                              }`}
                            />
                            {index < commitTree.length - 1 && <div className="w-0.5 h-8 bg-border" />}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="font-medium text-sm">{commit.commit.message.split("\n")[0]}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{commit.commit.author.name}</span>
                              <span>•</span>
                              <span className="font-mono">{commit.sha.substring(0, 7)}</span>
                              {commit.parents.length > 1 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <GitMerge className="h-3 w-3" />
                                    Merge
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
