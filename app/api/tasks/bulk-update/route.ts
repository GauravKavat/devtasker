import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

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
