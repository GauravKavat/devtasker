"use client";

import { useState } from "react";
import { useCreateInvitation } from "@/hooks/use-invitations";
import { useProjectRoles } from "@/hooks/use-project-roles";
import { Loader2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  projectId,
}: InviteMemberDialogProps) {
  const createInvitation = useCreateInvitation();
  const { roles, loading: rolesLoading } = useProjectRoles(projectId);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectableRoles = roles.length > 0 ? roles : [
    { id: "member", name: "Member" },
    { id: "admin", name: "Admin" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      alert("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      await createInvitation(projectId, email.trim(), role);
      setSuccess(true);
      setTimeout(() => {
        setEmail("");
        setRole("member");
        setSuccess(false);
        onOpenChange(false);
      }, 2000);
    } catch (error: any) {
      console.error("Failed to send invitation:", error);
      alert(error.message || "Failed to send invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail("");
      setRole("member");
      setSuccess(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new member to your project
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Send className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Invitation Sent!</h3>
            <p className="text-sm text-muted-foreground">
              An invitation email has been sent to {email}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={role}
                  onValueChange={setRole}
                  disabled={isSubmitting || rolesLoading}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder={rolesLoading ? "Loading roles" : "Select role"} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableRoles.map((roleItem) => (
                      <SelectItem key={roleItem.id} value={roleItem.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className={
                              roleItem.id === "admin"
                                ? "h-2 w-2 rounded-full bg-purple-500"
                                : "h-2 w-2 rounded-full bg-blue-500"
                            }
                          />
                          <div>
                            <div className="font-medium">{roleItem.name}</div>
                            {roleItem.id === "admin" ? (
                              <div className="text-xs text-muted-foreground">
                                Full access to manage project
                              </div>
                            ) : roleItem.id === "member" ? (
                              <div className="text-xs text-muted-foreground">
                                Can view and edit tasks
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
