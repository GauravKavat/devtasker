import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { sendInvitationEmail } from "@/lib/email/send-invitation";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_ROLES } from "@/lib/roles";
import { ensureUser, hasPermission } from "@/lib/rbac";

const SYSTEM_ROLE_IDS = new Set(DEFAULT_ROLES.map((role) => role.id));

async function isRoleValid(projectId: string, role: string, supabase: Awaited<ReturnType<typeof createClient>>) {
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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, email, role = "member" } = body;

    if (!projectId || !email) {
      return NextResponse.json(
        { error: "Project ID and email are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json(
        { error: "Failed to get user" },
        { status: 500 },
      );
    }

    const canInvite = await hasPermission(
      supabase as any,
      projectId,
      (dbUser as any).id,
      "members.invite",
    );

    if (!canInvite) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const validRole = await isRoleValid(projectId, role, supabase);

    if (!validRole) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 },
      );
    }

    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { data: existingInvitation } = await supabase
      .from("project_invitations")
      .select("*")
      .eq("project_id", projectId)
      .eq("email", email)
      .is("used_at", null)
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        { error: "An active invitation already exists for this email" },
        { status: 400 },
      );
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invitation, error: invitationError } = await supabase
      .from("project_invitations")
      .insert({
        project_id: projectId,
        email,
        token,
        role,
        invited_by: (dbUser as any).id,
        expires_at: expiresAt.toISOString(),
      } as any)
      .select()
      .single();

    if (invitationError) {
      console.error("Failed to create invitation:", invitationError);
      return NextResponse.json(
        { error: "Failed to create invitation" },
        { status: 500 },
      );
    }

    try {
      const inviterName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.emailAddresses[0]?.emailAddress || "A team member";

      await sendInvitationEmail({
        email,
        projectName: (project as any).name,
        inviterName,
        invitationToken: token,
      });
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      await supabase
        .from("project_invitations")
        .delete()
        .eq("id", (invitation as any).id);

      return NextResponse.json(
        { error: "Failed to send invitation email" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        invitation: {
          id: (invitation as any).id,
          email,
          token,
          expires_at: expiresAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
