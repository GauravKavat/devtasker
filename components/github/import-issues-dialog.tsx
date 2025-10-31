"use client";

import { useState } from "react";
import { useImportGitHubIssues } from "@/hooks/use-github";
import { useProjectRole } from "@/hooks/use-project-role";
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
import { Download, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportIssuesDialogProps {
  projectId: string;
  columnId: string;
  repoOwner?: string;
  repoName?: string;
}

export function ImportIssuesDialog({
  projectId,
  columnId,
  repoOwner: defaultOwner = "",
  repoName: defaultName = "",
}: ImportIssuesDialogProps) {
  const { isAdmin } = useProjectRole(projectId);
  const [isOpen, setIsOpen] = useState(false);
  const [repoOwner, setRepoOwner] = useState(defaultOwner);
  const [repoName, setRepoName] = useState(defaultName);
  const [issueNumbers, setIssueNumbers] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const importMutation = useImportGitHubIssues();

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!repoOwner.trim() || !repoName.trim()) {
      setError("Repository owner and name are required");
      return;
    }

    // Parse issue numbers if provided
    const numbers = issueNumbers
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n)
      .map((n) => parseInt(n))
      .filter((n) => !isNaN(n));

    try {
      const result = await importMutation.mutateAsync({
        projectId,
        columnId,
        repoOwner: repoOwner.trim(),
        repoName: repoName.trim(),
        issueNumbers: numbers.length > 0 ? numbers : undefined,
      });

      setSuccess(`Successfully imported ${result.count} issue(s)`);
      setTimeout(() => {
        setIsOpen(false);
        setRepoOwner(defaultOwner);
        setRepoName(defaultName);
        setIssueNumbers("");
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import issues");
    }
  };

  if (!isAdmin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Import Issues
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleImport}>
          <DialogHeader>
            <DialogTitle>Import GitHub Issues</DialogTitle>
            <DialogDescription>
              Import issues from a GitHub repository as tasks. Leave issue
              numbers empty to import all open issues.
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
                disabled={importMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Repository Name</Label>
              <Input
                id="name"
                placeholder="hello-world"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                disabled={importMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issues">Issue Numbers (Optional)</Label>
              <Input
                id="issues"
                placeholder="1, 5, 12"
                value={issueNumbers}
                onChange={(e) => setIssueNumbers(e.target.value)}
                disabled={importMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated issue numbers. Leave empty to import all open
                issues.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription className="text-green-600">
                  {success}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={importMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={importMutation.isPending}>
              {importMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
