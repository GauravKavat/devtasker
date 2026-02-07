import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUser, hasPermission } from "@/lib/rbac";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { meetingId } = await params;
    const updates = await request.json();

    const supabase = await createClient();
    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const { data: meetingRow } = await supabase
      .from("meetings")
      .select("project_id")
      .eq("id", meetingId)
      .single();

    const projectId = (meetingRow as any)?.project_id as string | undefined;

    if (!projectId) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const canEdit = await hasPermission(
      supabase as any,
      projectId,
      (dbUser as any).id,
      "meetings.create",
    );

    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: meeting, error } = await (supabase
      .from("meetings") as any)
      .update(updates as any)
      .eq("id", meetingId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update meeting" },
        { status: 500 },
      );
    }

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error("Error updating meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { meetingId } = await params;

    const supabase = await createClient();
    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const { data: meetingRow } = await supabase
      .from("meetings")
      .select("project_id")
      .eq("id", meetingId)
      .single();

    const projectId = (meetingRow as any)?.project_id as string | undefined;

    if (!projectId) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const canDelete = await hasPermission(
      supabase as any,
      projectId,
      (dbUser as any).id,
      "meetings.delete",
    );

    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("meetings")
      .delete()
      .eq("id", meetingId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete meeting" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
