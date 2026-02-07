import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUser, getProjectIdForColumn, hasPermission } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { columnId, title, description, start_date, end_date, assignee_id } = body;

    if (!columnId || !title) {
      return NextResponse.json(
        { error: "Column ID and title are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const projectId = await getProjectIdForColumn(supabase as any, columnId);

    if (!projectId) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    const canCreate = await hasPermission(
      supabase as any,
      projectId,
      (dbUser as any).id,
      "tasks.create",
    );

    if (!canCreate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: lastTask } = await supabase
      .from("tasks")
      .select("position")
      .eq("column_id", columnId)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const nextPosition = (lastTask as any)?.position
      ? (lastTask as any).position + 1
      : 0;

    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        column_id: columnId,
        title,
        description: description || null,
        start_date: start_date || null,
        end_date: end_date || null,
        assignee_id: assignee_id || null,
        position: nextPosition,
      } as any)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create task" },
        { status: 500 },
      );
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
