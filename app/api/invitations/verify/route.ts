import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from("project_invitations")
      .select(
        `
        *,
        project:projects(name),
        inviter:users!invited_by(clerk_user_id)
      `,
      )
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

    return NextResponse.json(
      {
        success: true,
        invitation: {
          project_name: (invitation as any).project?.name || "Unknown Project",
          role: (invitation as any).role,
          inviter_email:
            (invitation as any).inviter?.clerk_user_id || "Unknown",
          expires_at: (invitation as any).expires_at,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error verifying invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
