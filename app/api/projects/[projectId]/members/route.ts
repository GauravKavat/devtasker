import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";

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
