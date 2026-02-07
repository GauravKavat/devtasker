import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUser, getProjectIdForColumn, hasPermission } from "@/lib/rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { columnId } = await params;
    const updates = await request.json();

    const supabase = await createClient();
    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const projectId = await getProjectIdForColumn(supabase as any, columnId);

    if (!projectId) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    const canEdit = await hasPermission(
      supabase as any,
      projectId,
      (dbUser as any).id,
      "project.edit",
    );

    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: column, error } = await (supabase
      .from("columns") as any)
      .update(updates as any)
      .eq("id", columnId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update column" },
        { status: 500 },
      );
    }

    return NextResponse.json({ column });
  } catch (error) {
    console.error("Error updating column:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { columnId } = await params;

    const supabase = await createClient();
    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const projectId = await getProjectIdForColumn(supabase as any, columnId);

    if (!projectId) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    const canEdit = await hasPermission(
      supabase as any,
      projectId,
      (dbUser as any).id,
      "project.edit",
    );

    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("columns")
      .delete()
      .eq("id", columnId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete column" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting column:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
