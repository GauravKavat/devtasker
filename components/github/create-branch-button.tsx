"use client";

import { useState } from "react";
import { useCreateBranch } from "@/hooks/use-github";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GitBranch, Loader2, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateBranchButtonProps {
  taskId: string;
  taskTitle: string;
  repoOwner?: string;
  repoName?: string;
  baseBranch?: string;
}

export function CreateBranchButton({
  taskId,
  taskTitle,
  repoOwner: defaultOwner = "",
  repoName: defaultName = "",
  baseBranch: defaultBase = "main",
}: CreateBranchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [repoOwner, setRepoOwner] = useState(defaultOwner);
  const [repoName, setRepoName] = useState(defaultName);
  const [branchName, setBranchName] = useState("");
  const [baseBranch, setBaseBranch] = useState(defaultBase);
  const [error, setError] = useState<string | null>(null);
  const [createdBranch, setCreatedBranch] = useState<{ name: string; url: string } | null>(null);

  const createBranchMutation = useCreateBranch();

  // Generate suggested branch name from task
  const generateBranchName = () => {
    const sanitized = taskTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);
    return `feature/DT-${taskId.substring(0, 8)}-${sanitized}`;
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && !branchName) {
      setBranchName(generateBranchName());
    }
    if (!open) {
      setError(null);
      setCreatedBranch(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreatedBranch(null);

    if (!repoOwner.trim() || !repoName.trim() || !branchName.trim()) {
      setError("Repository owner, name, and branch name are required");
      return;
    }

    try {
      const result = await createBranchMutation.mutateAsync({
        taskId,
        repoOwner: repoOwner.trim(),
        repoName: repoName.trim(),
        branchName: branchName.trim(),
        baseBranch: baseBranch.trim(),
      });

      setCreatedBranch({
        name: result.branch.name,
        url: result.branch.url,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create branch");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <GitBranch className="h-4 w-4 mr-2" />
          Create Branch
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {!createdBranch ? (
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Feature Branch</DialogTitle>
              <DialogDescription>
                Create a new Git branch for this task in your repository
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="owner">Repository Owner</Label>
                <Input
                  id="owner"
                  placeholder="octocat"
                  value={repoOwner}
                  onChange={(e) => setRepoOwner(e.target.value)}
                  disabled={createBranchMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Repository Name</Label>
                <Input
                  id="name"
                  placeholder="hello-world"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  disabled={createBranchMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base">Base Branch</Label>
                <Input
                  id="base"
                  placeholder="main"
                  value={baseBranch}
                  onChange={(e) => setBaseBranch(e.target.value)}
                  disabled={createBranchMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">New Branch Name</Label>
                <Input
                  id="branch"
                  placeholder="feature/DT-123-task-name"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  disabled={createBranchMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Convention: feature/DT-{taskId.substring(0, 8)}-description
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={createBranchMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createBranchMutation.isPending}>
                {createBranchMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <GitBranch className="h-4 w-4 mr-2" />
                    Create
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Branch Created Successfully!</DialogTitle>
              <DialogDescription>
                Your feature branch has been created and is ready to use
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Alert>
                <GitBranch className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2 mt-2">
                    <p className="font-medium">{createdBranch.name}</p>
                    <a
                      href={createdBranch.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    >
                      View on GitHub <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </AlertDescription>
              </Alert>
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-xs font-mono">
                  git fetch origin && git checkout {createdBranch.name}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsOpen(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
