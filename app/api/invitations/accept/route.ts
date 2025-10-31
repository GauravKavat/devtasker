import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";
import { createSlug } from "@/lib/utils";

async function ensureUser(clerkUserId: string) {
  const supabase = getSupabaseClient();

  let { data: dbUser } = await supabase
    .from("users")
    .select("id, clerk_user_id")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (!dbUser) {
    const { data: newUser } = await supabase
      .from("users")
      .insert({ clerk_user_id: clerkUserId } as any)
      .select("id, clerk_user_id")
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
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch invitation with project details
    const { data: invitation, error: inviteError } = await supabase
      .from("project_invitations")
      .select(`
        id,
        project_id,
        email,
        role,
        expires_at,
        used_at,
        projects (
          id,
          name
        )
      `)
      .eq("token", token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Check if already used
    if ((invitation as any).used_at) {
      return NextResponse.json(
        { error: "This invitation has already been used" },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date((invitation as any).expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      );
    }

    // Ensure user exists in database
    const dbUser = await ensureUser(userId);

    if (!dbUser) {
      return NextResponse.json(
        { error: "Failed to get user" },
        { status: 500 }
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
      // Update invitation as used
      await (supabase
        .from("project_invitations") as any)
        .update({ used_at: new Date().toISOString() })
        .eq("id", (invitation as any).id);

      const projectSlug = createSlug(((invitation as any).projects as any).name);
      
      return NextResponse.json({
        success: true,
        projectSlug,
        message: "You are already a member of this project",
      });
    }

    // Add user to project_members
    console.log("Adding member:", {
      project_id: (invitation as any).project_id,
      user_id: (dbUser as any).id,
      role: (invitation as any).role,
    });

    const { data: newMember, error: memberError } = await supabase
      .from("project_members")
      .insert({
        project_id: (invitation as any).project_id,
        user_id: (dbUser as any).id,
        role: (invitation as any).role,
      } as any)
      .select();

    if (memberError) {
      console.error("Failed to add member:", memberError);
      return NextResponse.json(
        { error: "Failed to join project: " + memberError.message },
        { status: 500 }
      );
    }

    console.log("Member added successfully:", newMember);

    // Update invitation as used
    const { error: updateError } = await (supabase
      .from("project_invitations") as any)
      .update({ used_at: new Date().toISOString() })
      .eq("id", (invitation as any).id);

    if (updateError) {
      console.error("Failed to update invitation:", updateError);
    }

    // Return slug for redirect
    const projectSlug = createSlug(((invitation as any).projects as any).name);

    return NextResponse.json({
      success: true,
      projectSlug,
      message: "Successfully joined the project!",
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
