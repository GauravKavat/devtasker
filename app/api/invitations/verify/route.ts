import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch invitation with project and inviter details
    const { data: invitation, error } = await supabase
      .from("project_invitations")
      .select(`
        id,
        email,
        role,
        expires_at,
        used_at,
        project_id,
        invited_by,
        projects (
          id,
          name,
          description
        ),
        inviter:users!invited_by (
          clerk_user_id
        )
      `)
      .eq("token", token)
      .single();

    if (error || !invitation) {
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

    // Get inviter's Clerk user data
    const inviterClerkId = ((invitation as any).inviter as any)?.clerk_user_id;
    let inviterName = "A team member";
    
    if (inviterClerkId) {
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        const inviterUser = await client.users.getUser(inviterClerkId);
        inviterName = inviterUser.firstName && inviterUser.lastName
          ? `${inviterUser.firstName} ${inviterUser.lastName}`
          : inviterUser.emailAddresses[0]?.emailAddress || "A team member";
      } catch (err) {
        console.error("Failed to fetch inviter details:", err);
      }
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: (invitation as any).id,
        email: (invitation as any).email,
        role: (invitation as any).role,
        expires_at: (invitation as any).expires_at,
        project: (invitation as any).projects,
        inviter: {
          name: inviterName,
        },
      },
    });
  } catch (error) {
    console.error("Error verifying invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
