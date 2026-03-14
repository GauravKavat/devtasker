import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUser, getProjectIdForColumn, hasPermission } from "@/lib/rbac";
import { parseBulkTaskUpdates } from "@/lib/security/task-updates";

type TaskRow = {
  id: string;
  column_id: string;
  columns?: {
    project_id?: string;
  } | null;
};

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = parseBulkTaskUpdates(await request.json());
    const supabase = await createClient();
    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const taskIds = updates.map((update) => update.id);
    const { data: taskRows, error: taskRowsError } = await supabase
      .from("tasks")
      .select("id, column_id, columns(project_id)")
      .in("id", taskIds);

    if (taskRowsError) {
      throw taskRowsError;
    }

    const tasksById = new Map((taskRows as TaskRow[] | null)?.map((row) => [row.id, row]) ?? []);
    const missingTaskIds = taskIds.filter((taskId) => !tasksById.has(taskId));

    if (missingTaskIds.length > 0) {
      return NextResponse.json(
        { error: "Some tasks were not found", taskIds: missingTaskIds },
        { status: 404 },
      );
    }

    const projectIds = new Set<string>();

    for (const update of updates) {
      const taskRow = tasksById.get(update.id);
      const sourceProjectId = taskRow?.columns?.project_id;

      if (!sourceProjectId) {
        return NextResponse.json(
          { error: `Project not found for task ${update.id}` },
          { status: 404 },
        );
      }

      projectIds.add(sourceProjectId);

      if (update.column_id && update.column_id !== taskRow?.column_id) {
        const destinationProjectId = await getProjectIdForColumn(supabase as any, update.column_id);

        if (!destinationProjectId) {
          return NextResponse.json(
            { error: `Destination column not found for task ${update.id}` },
            { status: 404 },
          );
        }

        projectIds.add(destinationProjectId);
      }
    }

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

    const results = await Promise.all(
      updates.map(({ id, ...data }) =>
        (supabase.from("tasks") as any).update(data).eq("id", id),
      ),
    );

    const errors = results.filter((result: any) => result.error);
    if (errors.length > 0) {
      console.error("Errors updating tasks:", errors);
      return NextResponse.json(
        { error: "Failed to update some tasks" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid task updates payload", details: error.flatten() },
        { status: 400 },
      );
    }

    console.error("Error in PATCH /api/tasks/bulk-update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
