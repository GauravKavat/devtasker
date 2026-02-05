"use client";

import { useProjects } from "@/hooks/use-projects";
import { useProjectMembers, useUpdateMemberRole } from "@/hooks/use-project-members";
import { useProjectRole } from "@/hooks/use-project-role";
import {
  useCreateProjectRole,
  useDeleteProjectRole,
  useProjectRoles,
  useUpdateProjectRole,
} from "@/hooks/use-project-roles";
import { Loader2, Plus, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DEFAULT_ROLES, PERMISSION_GROUPS, RoleDefinition } from "@/lib/roles";

interface RolesProps {
  projectId?: string;
}

type PermissionGroup = (typeof PERMISSION_GROUPS)[number];

function PermissionPicker({
  selected,
  onChange,
  disabled,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const togglePermission = (permissionId: string) => {
    if (selected.includes(permissionId)) {
      onChange(selected.filter((perm) => perm !== permissionId));
      return;
    }

    onChange([...selected, permissionId]);
  };

  const toggleGroup = (group: PermissionGroup) => {
    const groupPermissions = group.permissions.map((perm) => perm.id);
    const hasAll = groupPermissions.every((perm) => selected.includes(perm));

    if (hasAll) {
      onChange(selected.filter((perm) => !groupPermissions.includes(perm)));
      return;
    }

    const merged = new Set([...selected, ...groupPermissions]);
    onChange(Array.from(merged));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          Permissions ({selected.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-4" align="start">
        <div className="space-y-4">
          {PERMISSION_GROUPS.map((group) => {
            const groupPermissions = group.permissions.map((perm) => perm.id);
            const hasAll = groupPermissions.every((perm) =>
              selected.includes(perm),
            );

            return (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{group.label}</p>
                  <Button
                    size="sm"
                    variant={hasAll ? "default" : "outline"}
                    onClick={() => toggleGroup(group)}
                    disabled={disabled}
                  >
                    {hasAll ? "All" : "Club"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.permissions.map((permission) => {
                    const isSelected = selected.includes(permission.id);
                    return (
                      <button
                        key={permission.id}
                        type="button"
                        onClick={() => togglePermission(permission.id)}
                        disabled={disabled}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:border-primary/50",
                          disabled && "cursor-not-allowed opacity-60",
                        )}
                      >
                        {permission.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function Roles({ projectId }: RolesProps) {
  const { loading } = useProjects();
  const { members, loading: membersLoading } = useProjectMembers(projectId || "");
  const updateMemberRole = useUpdateMemberRole();
  const { isAdmin, role: currentRole, loading: roleLoading } = useProjectRole(
    projectId || "",
  );
  const { roles: storedRoles, loading: rolesLoading } = useProjectRoles(
    projectId || "",
  );
  const createRole = useCreateProjectRole();
  const updateRole = useUpdateProjectRole();
  const deleteRole = useDeleteProjectRole();
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  const roles = storedRoles.length > 0 ? storedRoles : DEFAULT_ROLES;

  const availableRoles = useMemo(() => {
    const roleMap = new Map<string, RoleDefinition>();
    roles.forEach((roleItem) => roleMap.set(roleItem.id, roleItem));

    members.forEach((member: any) => {
      if (!member.role || roleMap.has(member.role)) return;
      roleMap.set(member.role, {
        id: member.role,
        name: member.role,
        permissions: [],
      });
    });

    return Array.from(roleMap.values());
  }, [roles, members]);

  const handleCreateRole = async () => {
    const trimmedName = newRoleName.trim();
    if (!trimmedName || !projectId) return;

    setIsCreatingRole(true);
    try {
      await createRole(projectId, trimmedName, newRolePermissions);
      setNewRoleName("");
      setNewRolePermissions([]);
    } catch (error: any) {
      console.error("Failed to create role:", error);
      alert(error.message || "Failed to create role");
    } finally {
      setIsCreatingRole(false);
    }
  };

  const handleUpdateRolePermissions = async (roleId: string, next: string[]) => {
    if (!projectId) return;

    try {
      await updateRole(projectId, roleId, next);
    } catch (error: any) {
      console.error("Failed to update role:", error);
      alert(error.message || "Failed to update role");
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!projectId) return;

    try {
      await deleteRole(projectId, roleId);
    } catch (error: any) {
      console.error("Failed to delete role:", error);
      alert(error.message || "Failed to delete role");
    }
  };

  const handleMemberRoleChange = async (memberId: string, roleId: string) => {
    if (!projectId) return;
    await updateMemberRole(memberId, roleId, projectId);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {roleLoading ? "Checking role..." : currentRole || "member"}
          </Badge>
          {isAdmin && (
            <Badge variant="default">
              <ShieldCheck className="h-3 w-3" />
              Admin
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Roles</CardTitle>
          <CardDescription>
            Create roles with permission sets. Club permissions per group.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isAdmin ? (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              Only project admins can create or edit roles.
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[240px] flex-1">
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  Role name
                </label>
                <Input
                  value={newRoleName}
                  onChange={(event) => setNewRoleName(event.target.value)}
                  placeholder="e.g. QA Lead"
                />
              </div>
              <PermissionPicker
                selected={newRolePermissions}
                onChange={setNewRolePermissions}
                disabled={!isAdmin}
              />
              <Button
                onClick={handleCreateRole}
                disabled={!newRoleName.trim() || isCreatingRole}
              >
                <Plus className="mr-2 h-4 w-4" />
                {isCreatingRole ? "Adding..." : "Add role"}
              </Button>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {rolesLoading ? (
              <div className="text-sm text-muted-foreground">Loading roles...</div>
            ) : (
              roles.map((roleItem) => (
                <div
                  key={roleItem.id}
                  className="rounded-lg border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{roleItem.name}</p>
                        {roleItem.system && (
                          <Badge variant="outline">System</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {roleItem.permissions.length} permission
                        {roleItem.permissions.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PermissionPicker
                        selected={roleItem.permissions}
                        onChange={(next) =>
                          handleUpdateRolePermissions(roleItem.id, next)
                        }
                        disabled={!isAdmin || roleItem.system}
                      />
                      {!roleItem.system && isAdmin ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveRole(roleItem.id)}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {roleItem.permissions.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {roleItem.permissions.slice(0, 6).map((permission) => (
                        <Badge key={permission} variant="secondary">
                          {permission}
                        </Badge>
                      ))}
                      {roleItem.permissions.length > 6 && (
                        <Badge variant="outline">
                          +{roleItem.permissions.length - 6} more
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">
                      No permissions assigned yet.
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Member Roles</CardTitle>
          <CardDescription>
            Assign a role to each member of this project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {membersLoading || loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading members...
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No members found for this project yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member: any) => {
                  const name = member.clerk_user
                    ? `${member.clerk_user.firstName || ""} ${
                        member.clerk_user.lastName || ""
                      }`.trim() || "Team member"
                    : "Team member";
                  const email = member.clerk_user?.email || "-";
                  const memberRole = member.role || "member";

                  return (
                    <TableRow key={member.id}>
                      <TableCell>{name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {email}
                      </TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <Select
                            value={memberRole}
                            onValueChange={(value) =>
                              handleMemberRoleChange(member.id, value)
                            }
                          >
                            <SelectTrigger className="h-9 w-[180px]">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableRoles.map((roleItem) => (
                                <SelectItem key={roleItem.id} value={roleItem.id}>
                                  {roleItem.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary">{memberRole}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
