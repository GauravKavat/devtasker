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
      "project.view",
    );

    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: columns, error } = await supabase
      .from("columns")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch columns" },
        { status: 500 },
      );
    }

    return NextResponse.json({ columns: columns || [] });
  } catch (error) {
    console.error("Error fetching columns:", error);
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
    const { projectId, name, color } = body;

    if (!projectId || !name) {
      return NextResponse.json(
        { error: "Project ID and name are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
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

    const { data: lastColumn } = await supabase
      .from("columns")
      .select("position")
      .eq("project_id", projectId)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const nextPosition = (lastColumn as any)?.position
      ? (lastColumn as any).position + 1
      : 0;

    const { data: column, error } = await supabase
      .from("columns")
      .insert({
        project_id: projectId,
        name,
        color: color || null,
        position: nextPosition,
      } as any)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create column" },
        { status: 500 },
      );
    }

    return NextResponse.json({ column });
  } catch (error) {
    console.error("Error creating column:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
