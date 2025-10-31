"use client";

import { useState } from "react";
import {
  useProjectMembers,
  useUpdateMemberRole,
  useRemoveMember,
} from "@/hooks/use-project-members";
import { useProjectRole } from "@/hooks/use-project-role";
import { useUser } from "@clerk/nextjs";
import { Loader2, Mail, UserCircle, Trash2, Plus, Send } from "lucide-react";
import { InviteMemberDialog } from "@/components/invite-member-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TeamsProps {
  projectId?: string;
}

export default function Teams({ projectId }: TeamsProps) {
  const { user } = useUser();
  const { members, loading: membersLoading } = useProjectMembers(
    projectId || "",
  );
  const { isAdmin, loading: roleLoading } = useProjectRole(projectId || "");
  const updateMemberRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!projectId) return;
    setUpdatingRole(memberId);
    try {
      await updateMemberRole(memberId, newRole, projectId);
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("Failed to update member role");
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!projectId) return;
    if (!confirm("Are you sure you want to remove this member?")) return;

    setRemovingMember(memberId);
    try {
      await removeMember(memberId, projectId);
    } catch (error) {
      console.error("Failed to remove member:", error);
      alert("Failed to remove member");
    } finally {
      setRemovingMember(null);
    }
  };

  const loading = membersLoading || roleLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No project selected</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage your project team and their roles
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsInviteDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
          <CardDescription>
            {isAdmin
              ? "View and manage team member roles"
              : "View team members and their roles"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No team members yet
              </h3>
              <p className="text-muted-foreground mb-4 max-w-sm">
                Invite team members to collaborate on this project
              </p>
              {isAdmin && (
                <Button onClick={() => setIsInviteDialogOpen(true)}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invitation
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    {isAdmin && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member: any) => {
                    const isCurrentUser =
                      member.user?.clerk_user_id === user?.id;

                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-5 w-5 text-muted-foreground" />
                            <span>
                              {member.user?.clerk_user_id || "Unknown User"}
                              {isCurrentUser && (
                                <Badge variant="secondary" className="ml-2">
                                  You
                                </Badge>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {member.user?.clerk_user_id || "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isAdmin && !isCurrentUser ? (
                            <Select
                              value={member.role}
                              onValueChange={(value) =>
                                handleRoleChange(member.id, value)
                              }
                              disabled={updatingRole === member.id}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                                    Admin
                                  </div>
                                </SelectItem>
                                <SelectItem value="member">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                    Member
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant={
                                member.role === "admin"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {member.role === "admin" ? (
                                <div className="flex items-center gap-1">
                                  <div className="h-2 w-2 rounded-full bg-purple-300" />
                                  Admin
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <div className="h-2 w-2 rounded-full bg-blue-300" />
                                  Member
                                </div>
                              )}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(member.joined_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            {!isCurrentUser && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleRemoveMember(member.id)}
                                disabled={removingMember === member.id}
                              >
                                {removingMember === member.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {!isAdmin && (
        <Card className="border-muted">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              💡 You have read-only access. Only admins can manage team members
              and roles.
            </p>
          </CardContent>
        </Card>
      )}

      {isAdmin && projectId && (
        <InviteMemberDialog
          open={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
          projectId={projectId}
        />
      )}
    </div>
  );
}
