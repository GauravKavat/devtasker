import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";

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

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const supabase = getSupabaseClient() as any;
    const dbUser = await ensureUser(userId);

    if (!dbUser) {
      return NextResponse.json(
        { error: "Failed to get user" },
        { status: 500 },
      );
    }

    // Get invitation
    const { data: invitation, error: invitationError } = await supabase
      .from("project_invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 },
      );
    }

    // Check if already used
    if ((invitation as any).used_at) {
      return NextResponse.json(
        { error: "This invitation has already been used" },
        { status: 400 },
      );
    }

    // Check if expired
    const expiresAt = new Date((invitation as any).expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 },
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", (invitation as any).project_id)
      .eq("user_id", (dbUser as any).id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of this project" },
        { status: 400 },
      );
    }

    // Add user as project member
    const { error: memberError } = await supabase
      .from("project_members")
      .insert({
        project_id: (invitation as any).project_id,
        user_id: (dbUser as any).id,
        role: (invitation as any).role,
        invited_by: (invitation as any).invited_by,
      } as any);

    if (memberError) {
      console.error("Failed to add member:", memberError);
      return NextResponse.json(
        { error: "Failed to join project" },
        { status: 500 },
      );
    }

    // Mark invitation as used
    const invitationId = (invitation as any).id as string;
    await supabase
      .from("project_invitations")
      .update({ used_at: new Date().toISOString() })
      .eq("id", invitationId);

    // Get project details
    const { data: project } = await supabase
      .from("projects")
      .select("id, name, description")
      .eq("id", (invitation as any).project_id)
      .single();

    return NextResponse.json(
      {
        success: true,
        project,
        message: "Successfully joined the project",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
