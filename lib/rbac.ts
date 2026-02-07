import { DEFAULT_ROLES } from "@/lib/roles";

const DEFAULT_ROLE_MAP = new Map(
  DEFAULT_ROLES.map((role) => [role.id, role.permissions]),
);

type SupabaseLike = {
  from: (table: string) => any;
};

export async function ensureUser(
  supabase: SupabaseLike,
  clerkUserId: string,
) {
  let { data: dbUser } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (!dbUser) {
    const { data: newUser } = await supabase
      .from("users")
      .insert({ clerk_user_id: clerkUserId } as any)
      .select("id")
      .single();
    dbUser = newUser;
  }

  return dbUser as any;
}

export async function getMemberRole(
  supabase: SupabaseLike,
  projectId: string,
  userId: string,
) {
  const { data } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();

  return (data as any)?.role as string | undefined;
}

export async function getRolePermissions(
  supabase: SupabaseLike,
  projectId: string,
  role: string,
) {
  if (DEFAULT_ROLE_MAP.has(role)) {
    return DEFAULT_ROLE_MAP.get(role) || [];
  }

  const { data } = await supabase
    .from("project_roles")
    .select("permissions")
    .eq("project_id", projectId)
    .eq("name", role)
    .single();

  return ((data as any)?.permissions as string[]) || [];
}

export async function hasPermission(
  supabase: SupabaseLike,
  projectId: string,
  userId: string,
  permission: string,
) {
  const role = await getMemberRole(supabase, projectId, userId);

  if (!role) return false;
  if (role === "admin") return true;

  const permissions = await getRolePermissions(supabase, projectId, role);
  return permissions.includes(permission);
}

export async function getProjectIdForTask(
  supabase: SupabaseLike,
  taskId: string,
) {
  const { data } = await supabase
    .from("tasks")
    .select("id, column_id, columns(project_id)")
    .eq("id", taskId)
    .single();

  return (data as any)?.columns?.project_id as string | undefined;
}

export async function getProjectIdForRepo(
  supabase: SupabaseLike,
  repoId: string,
) {
  const { data } = await supabase
    .from("project_repos")
    .select("project_id")
    .eq("id", repoId)
    .single();

  return (data as any)?.project_id as string | undefined;
}

export async function getProjectIdForTaskLink(
  supabase: SupabaseLike,
  linkId: string,
) {
  const { data } = await supabase
    .from("task_github_links")
    .select("task_id")
    .eq("id", linkId)
    .single();

  const taskId = (data as any)?.task_id as string | undefined;
  if (!taskId) return undefined;

  return getProjectIdForTask(supabase, taskId);
}
