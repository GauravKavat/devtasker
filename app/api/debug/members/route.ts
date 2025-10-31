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
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch all members
    const { data: members, error: membersError } = await supabase
      .from("project_members")
      .select(`
        *,
        user:users(*)
      `)
      .eq("project_id", projectId);

    if (membersError) {
      return NextResponse.json(
        { error: "Failed to fetch members", details: membersError },
        { status: 500 }
      );
    }

    // Fetch all users
    const { data: allUsers, error: usersError } = await supabase
      .from("users")
      .select("*");

    if (usersError) {
      return NextResponse.json(
        { error: "Failed to fetch users", details: usersError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      projectId,
      members: members || [],
      allUsers: allUsers || [],
      memberCount: members?.length || 0,
      userCount: allUsers?.length || 0,
    });
  } catch (error) {
    console.error("Error debugging members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
