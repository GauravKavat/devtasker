import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import {
  ensureUser,
  getProjectIdForColumn,
  getProjectIdForTask,
  hasPermission,
} from "@/lib/rbac";
import { parseTaskUpdate } from "@/lib/security/task-updates";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;
    const updates = parseTaskUpdate(await request.json());
    const supabase = await createClient();
    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const sourceProjectId = await getProjectIdForTask(supabase as any, taskId);

    if (!sourceProjectId) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const sourceAllowed = await hasPermission(
      supabase as any,
      sourceProjectId,
      (dbUser as any).id,
      "tasks.edit",
    );

    if (!sourceAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (updates.column_id) {
      const destinationProjectId = await getProjectIdForColumn(
        supabase as any,
        updates.column_id,
      );

      if (!destinationProjectId) {
        return NextResponse.json({ error: "Destination column not found" }, { status: 404 });
      }

      if (destinationProjectId !== sourceProjectId) {
        const destinationAllowed = await hasPermission(
          supabase as any,
          destinationProjectId,
          (dbUser as any).id,
          "tasks.edit",
        );

        if (!destinationAllowed) {
          return NextResponse.json(
            { error: "Forbidden to move task into destination project" },
            { status: 403 },
          );
        }
      }
    }

    const { data: task, error } = await (supabase.from("tasks") as any)
      .update(updates)
      .eq("id", taskId)
      .select()
      .single();

    if (error) {
      console.error("Error updating task:", error);
      return NextResponse.json(
        { error: "Failed to update task" },
        { status: 500 },
      );
    }

    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid task update payload", details: error.flatten() },
        { status: 400 },
      );
    }

    console.error("Error in PATCH /api/tasks/[taskId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    const canDelete = await hasPermission(
      supabase as any,
      projectId,
      (dbUser as any).id,
      "tasks.delete",
    );

    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete task" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
