import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUser, getProjectIdForTask, hasPermission } from "@/lib/rbac";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;

    const supabase = await createClient();
    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const projectId = await getProjectIdForTask(supabase as any, taskId);

    if (!projectId) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const canView = await hasPermission(
      supabase as any,
      projectId,
      (dbUser as any).id,
      "tasks.view",
    );

    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: commits, error } = await supabase
      .from("github_commits")
      .select("*")
      .eq("task_id", taskId)
      .order("committed_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch commits" },
        { status: 500 },
      );
    }

    return NextResponse.json({ commits: commits || [] });
  } catch (error) {
    console.error("Error fetching commits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
