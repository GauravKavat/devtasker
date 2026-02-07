import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUser, hasPermission } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const canView = await hasPermission(
      supabase as any,
      projectId,
      (dbUser as any).id,
      "meetings.view",
    );

    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: meetings, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("project_id", projectId)
      .order("start_time", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch meetings" },
        { status: 500 },
      );
    }

    return NextResponse.json({ meetings: meetings || [] });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      project_id: projectId,
      title,
      description,
      start_time,
      end_time,
      attendees,
      google_calendar_event_id,
    } = body;

    if (!projectId || !title || !start_time) {
      return NextResponse.json(
        { error: "Project ID, title, and start time are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const canCreate = await hasPermission(
      supabase as any,
      projectId,
      (dbUser as any).id,
      "meetings.create",
    );

    if (!canCreate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: meeting, error } = await supabase
      .from("meetings")
      .insert({
        project_id: projectId,
        title,
        description: description || null,
        start_time,
        end_time: end_time || null,
        created_by: userId,
        attendees: Array.isArray(attendees) ? attendees : null,
        google_calendar_event_id: google_calendar_event_id || null,
      } as any)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create meeting" },
        { status: 500 },
      );
    }

    return NextResponse.json({ meeting });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
