import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";
import { ALL_PERMISSIONS, DEFAULT_ROLES } from "@/lib/roles";

const SYSTEM_ROLE_IDS = new Set(DEFAULT_ROLES.map((role) => role.id));
const DEFAULT_ROLE_MAP = new Map(
  DEFAULT_ROLES.map((role) => [role.id, role.permissions]),
);

async function ensureUser(clerkUserId: string) {
  const supabase = getSupabaseClient();

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

  return dbUser;
}

async function getMemberRole(
  projectId: string,
  userId: string,
  supabase = getSupabaseClient(),
) {
  const { data } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .single();

  return (data as any)?.role as string | undefined;
}

async function getRolePermissions(
  projectId: string,
  role: string,
  supabase = getSupabaseClient(),
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

async function canManageRoles(
  projectId: string,
  userId: string,
  supabase = getSupabaseClient(),
) {
  const role = await getMemberRole(projectId, userId, supabase);

  if (!role) return false;
  if (role === "admin") return true;

  const permissions = await getRolePermissions(projectId, role, supabase);
  return permissions.includes("members.roles");
}

function validatePermissions(permissions: unknown) {
  if (!Array.isArray(permissions)) {
    return { valid: false, error: "Permissions must be an array" };
  }

  const invalid = permissions.filter(
    (perm) => typeof perm !== "string" || !ALL_PERMISSIONS.includes(perm),
  );

  if (invalid.length > 0) {
    return {
      valid: false,
      error: `Invalid permissions: ${invalid.join(", ")}`,
    };
  }

  return { valid: true, permissions: permissions as string[] };
}

function normalizeRoleName(value: string) {
  return value.trim();
}

async function isRoleNameTaken(
  projectId: string,
  name: string,
  supabase = getSupabaseClient(),
) {
  const lower = name.toLowerCase();
  if ([...SYSTEM_ROLE_IDS].some((role) => role.toLowerCase() === lower)) {
    return true;
  }

  const { data } = await supabase
    .from("project_roles")
    .select("name")
    .eq("project_id", projectId)
    .ilike("name", name)
    .maybeSingle();

  return !!data;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseClient();
    const dbUser = await ensureUser(userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const memberRole = await getMemberRole(projectId, (dbUser as any).id, supabase);

    if (!memberRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: customRoles, error } = await supabase
      .from("project_roles")
      .select("id, name, permissions")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch roles" },
        { status: 500 },
      );
    }

    const roles = [
      ...DEFAULT_ROLES,
      ...(customRoles || []).map((role) => ({
        id: (role as any).name,
        name: (role as any).name,
        permissions: ((role as any).permissions as string[]) || [],
      })),
    ];

    return NextResponse.json({ success: true, roles });
  } catch (error) {
    console.error("Error fetching project roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { name, permissions } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 },
      );
    }

    const roleName = normalizeRoleName(name);

    if (!roleName) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 },
      );
    }

    if (SYSTEM_ROLE_IDS.has(roleName.toLowerCase())) {
      return NextResponse.json(
        { error: "Role name is reserved" },
        { status: 400 },
      );
    }

    const validation = validatePermissions(permissions || []);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const dbUser = await ensureUser(userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const canManage = await canManageRoles(projectId, (dbUser as any).id, supabase);

    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const exists = await isRoleNameTaken(projectId, roleName, supabase);

    if (exists) {
      return NextResponse.json(
        { error: "A role with this name already exists" },
        { status: 409 },
      );
    }

    const { data: role, error } = await supabase
      .from("project_roles")
      .insert({
        project_id: projectId,
        name: roleName,
        permissions: validation.permissions || [],
      } as any)
      .select("id, name, permissions")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create role" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      role: {
        id: (role as any).name,
        name: (role as any).name,
        permissions: ((role as any).permissions as string[]) || [],
      },
    });
  } catch (error) {
    console.error("Error creating project role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { roleId, permissions } = body;

    if (!roleId || typeof roleId !== "string") {
      return NextResponse.json(
        { error: "Role id is required" },
        { status: 400 },
      );
    }

    if (SYSTEM_ROLE_IDS.has(roleId.toLowerCase())) {
      return NextResponse.json(
        { error: "System roles cannot be edited" },
        { status: 400 },
      );
    }

    const validation = validatePermissions(permissions || []);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const dbUser = await ensureUser(userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const canManage = await canManageRoles(projectId, (dbUser as any).id, supabase);

    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: role, error } = await (supabase
      .from("project_roles") as any)
      .update({ permissions: validation.permissions || [] })
      .eq("project_id", projectId)
      .eq("name", roleId)
      .select("id, name, permissions")
      .single();

    if (error || !role) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      role: {
        id: (role as any).name,
        name: (role as any).name,
        permissions: ((role as any).permissions as string[]) || [],
      },
    });
  } catch (error) {
    console.error("Error updating project role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { roleId } = body;

    if (!roleId || typeof roleId !== "string") {
      return NextResponse.json(
        { error: "Role id is required" },
        { status: 400 },
      );
    }

    if (SYSTEM_ROLE_IDS.has(roleId.toLowerCase())) {
      return NextResponse.json(
        { error: "System roles cannot be deleted" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseClient();
    const dbUser = await ensureUser(userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const canManage = await canManageRoles(projectId, (dbUser as any).id, supabase);

    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("project_roles")
      .delete()
      .eq("project_id", projectId)
      .eq("name", roleId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete role" },
        { status: 500 },
      );
    }

    await (supabase.from("project_members") as any)
      .update({ role: "member" })
      .eq("project_id", projectId)
      .eq("role", roleId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
