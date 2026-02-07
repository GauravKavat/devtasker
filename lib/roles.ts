export type PermissionDefinition = {
  id: string;
  label: string;
  description?: string;
};

export type PermissionGroup = {
  id: string;
  label: string;
  permissions: PermissionDefinition[];
};

export type RoleDefinition = {
  id: string;
  name: string;
  permissions: string[];
  system?: boolean;
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "project",
    label: "Project",
    permissions: [
      { id: "project.view", label: "View project" },
      { id: "project.edit", label: "Edit project" },
      { id: "project.delete", label: "Delete project" },
    ],
  },
  {
    id: "tasks",
    label: "Tasks",
    permissions: [
      { id: "tasks.view", label: "View tasks" },
      { id: "tasks.create", label: "Create tasks" },
      { id: "tasks.edit", label: "Edit tasks" },
      { id: "tasks.delete", label: "Delete tasks" },
    ],
  },
  {
    id: "meetings",
    label: "Meetings",
    permissions: [
      { id: "meetings.view", label: "View meetings" },
      { id: "meetings.create", label: "Schedule meetings" },
      { id: "meetings.delete", label: "Delete meetings" },
    ],
  },
  {
    id: "members",
    label: "Members",
    permissions: [
      { id: "members.view", label: "View members" },
      { id: "members.invite", label: "Invite members" },
      { id: "members.roles", label: "Manage roles" },
      { id: "members.remove", label: "Remove members" },
    ],
  },
  {
    id: "github",
    label: "GitHub",
    permissions: [
      { id: "github.connect", label: "Connect repos" },
      { id: "github.import", label: "Import issues" },
      { id: "github.branch", label: "Create branches" },
    ],
  },
];

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((perm) => perm.id),
);

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: "admin",
    name: "Admin",
    permissions: ALL_PERMISSIONS,
    system: true,
  },
  {
    id: "member",
    name: "Member",
    permissions: [
      "project.view",
      "tasks.view",
      "tasks.create",
      "tasks.edit",
      "members.view",
      "meetings.view",
      "meetings.create",
      "github.connect",
      "github.import",
    ],
    system: true,
  },
];
