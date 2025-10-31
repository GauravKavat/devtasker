import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";
import { sendInvitationEmail } from "@/lib/email/send-invitation";
import { v4 as uuidv4 } from "uuid";

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

    const supabase = getSupabaseClient();
    const dbUser = await ensureUser(userId);

    if (!dbUser) {
      return NextResponse.json(
        { error: "Failed to get user" },
        { status: 500 },
      );
    }

    // Check if user is admin of the project
    const { data: memberCheck } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", (dbUser as any).id)
      .single();

    if (!memberCheck || (memberCheck as any).role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can invite members" },
        { status: 403 },
      );
    }

    // Get project details
    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if invitation already exists and not used
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

    // Generate unique token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Create invitation
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

    // Send invitation email
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
      // Delete the invitation if email fails
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
