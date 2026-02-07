import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";
import { DEFAULT_ROLES } from "@/lib/roles";
import { ensureUser, hasPermission } from "@/lib/rbac";

const SYSTEM_ROLE_IDS = new Set(DEFAULT_ROLES.map((role) => role.id));
const DEFAULT_ROLE_MAP = new Map(
  DEFAULT_ROLES.map((role) => [role.id, role.permissions]),
);

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

async function isRoleValid(
  projectId: string,
  role: string,
  supabase = getSupabaseClient(),
) {
  if (!role) return false;
  if (SYSTEM_ROLE_IDS.has(role)) return true;

  const { data } = await supabase
    .from("project_roles")
    .select("id")
    .eq("project_id", projectId)
    .eq("name", role)
    .maybeSingle();

  return !!data;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
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
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const canView = await hasPermission(
      supabase as any,
      projectId,
      (dbUser as any).id,
      "members.view",
    );

    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // First, try to fetch members
    console.log("Fetching members for project:", projectId);
    
    const { data: members, error: membersError } = await supabase
      .from("project_members")
      .select("*")
      .eq("project_id", projectId)
      .order("joined_at", { ascending: true });

    if (membersError) {
      console.error("Error fetching members:", membersError);
      return NextResponse.json(
        { error: "Failed to fetch members", details: membersError.message },
        { status: 500 }
      );
    }

    console.log("Found members:", members?.length || 0, members);

    // Fetch user details from Clerk for each member
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();

    // Get user_ids and fetch their details from users table
    const userIds = members?.map((m: any) => m.user_id) || [];
    console.log("Fetching users for user_ids:", userIds);
    
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .in("id", userIds);

    if (usersError) {
      console.error("Error fetching users:", usersError);
    } else {
      console.log("Found users:", users?.length || 0, users);
    }

    // Enrich members with Clerk user data
    console.log("Enriching members with Clerk data...");
    
    const enrichedMembers = await Promise.all(
      (members || []).map(async (member: any) => {
        const dbUser = users?.find((u: any) => u.id === member.user_id);
        console.log(`Member ${member.id}: Found dbUser:`, (dbUser as any)?.clerk_user_id);
        
        let clerkUser = null;

        if ((dbUser as any)?.clerk_user_id) {
          try {
            clerkUser = await client.users.getUser((dbUser as any).clerk_user_id);
            console.log(`Clerk user fetched for ${(dbUser as any).clerk_user_id}:`, clerkUser.firstName, clerkUser.lastName);
          } catch (err) {
            console.error(`Failed to fetch Clerk user for ${(dbUser as any).clerk_user_id}:`, err);
          }
        }

        return {
          ...member,
          user: dbUser,
          clerk_user: clerkUser ? {
            id: clerkUser.id,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            email: clerkUser.emailAddresses[0]?.emailAddress,
            imageUrl: clerkUser.imageUrl,
          } : null,
        };
      })
    );

    console.log("Final enriched members count:", enrichedMembers.length);

    return NextResponse.json({
      success: true,
      members: enrichedMembers,
      count: enrichedMembers.length,
    });
  } catch (error) {
    console.error("Error fetching project members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
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
        { status: 400 }
      );
    }

    const body = await request.json();
    const { memberId, role } = body;

    if (!memberId || !role) {
      return NextResponse.json(
        { error: "memberId and role are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data: dbUser } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    if (!dbUser) {
      return NextResponse.json(
        { error: "Failed to get user" },
        { status: 500 }
      );
    }

    const canManage = await canManageRoles(projectId, (dbUser as any).id, supabase);

    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const validRole = await isRoleValid(projectId, role, supabase);

    if (!validRole) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    const { error } = await (supabase as any)
      .from("project_members")
      .update({ role })
      .eq("id", memberId)
      .eq("project_id", projectId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update member role" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
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
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const canRemove = await hasPermission(
      supabase as any,
      projectId,
      (dbUser as any).id,
      "members.remove",
    );

    if (!canRemove) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("id", memberId)
      .eq("project_id", projectId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing project member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
