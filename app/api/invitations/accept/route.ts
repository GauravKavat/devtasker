import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { createSlug } from "@/lib/utils";
import { ensureUser } from "@/lib/rbac";

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
        { status: 400 },
      );
    }

    const supabase = await createClient();

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
        { status: 404 },
      );
    }

    if ((invitation as any).used_at) {
      return NextResponse.json(
        { error: "This invitation has already been used" },
        { status: 400 },
      );
    }

    if (new Date((invitation as any).expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 },
      );
    }

    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json(
        { error: "Failed to get user" },
        { status: 500 },
      );
    }

    const { data: existingMember } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", (invitation as any).project_id)
      .eq("user_id", (dbUser as any).id)
      .single();

    if (existingMember) {
      await (supabase.from("project_invitations") as any)
        .update({ used_at: new Date().toISOString() })
        .eq("id", (invitation as any).id);

      const projectSlug = createSlug(((invitation as any).projects as any).name);

      return NextResponse.json({
        success: true,
        projectSlug,
        message: "You are already a member of this project",
      });
    }

    const { error: memberError } = await supabase
      .from("project_members")
      .insert({
        project_id: (invitation as any).project_id,
        user_id: (dbUser as any).id,
        role: (invitation as any).role,
      } as any);

    if (memberError) {
      console.error("Failed to add member:", memberError);
      return NextResponse.json(
        { error: `Failed to join project: ${memberError.message}` },
        { status: 500 },
      );
    }

    const { error: updateError } = await (supabase.from("project_invitations") as any)
      .update({ used_at: new Date().toISOString() })
      .eq("id", (invitation as any).id);

    if (updateError) {
      console.error("Failed to update invitation:", updateError);
    }

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
      { status: 500 },
    );
  }
}
