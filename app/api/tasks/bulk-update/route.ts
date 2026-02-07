import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUser, hasPermission } from "@/lib/rbac";

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { updates } = await request.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Invalid updates array" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const taskIds = updates.map((update: any) => update.id).filter(Boolean);

    const { data: taskRows } = await supabase
      .from("tasks")
      .select("id, columns(project_id)")
      .in("id", taskIds);

    const projectIds = new Set(
      (taskRows || [])
        .map((row: any) => row?.columns?.project_id)
        .filter(Boolean),
    );

    for (const projectId of projectIds) {
      const canEdit = await hasPermission(
        supabase as any,
        projectId,
        (dbUser as any).id,
        "tasks.edit",
      );

      if (!canEdit) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Update tasks in bulk
    const updatePromises = updates.map(({ id, ...data }) =>
      (supabase.from("tasks") as any).update(data).eq("id", id)
    );

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter((result: any) => result.error);
    if (errors.length > 0) {
      console.error("Errors updating tasks:", errors);
      return NextResponse.json(
        { error: "Failed to update some tasks" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PATCH /api/tasks/bulk-update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
