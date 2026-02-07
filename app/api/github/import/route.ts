import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUser, hasPermission } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { projectId, columnId, repoOwner, repoName, issueNumbers } =
      await request.json();

    if (!projectId || !columnId || !repoOwner || !repoName) {
      return NextResponse.json(
        {
          error:
            "Project ID, column ID, repository owner, and name are required",
        },
        { status: 400 },
      );
    }

    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const canImport = await hasPermission(
      supabase as any,
      projectId,
      (dbUser as any).id,
      "github.import",
    );

    if (!canImport) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: column } = await supabase
      .from("columns")
      .select("id, project_id")
      .eq("id", columnId)
      .single();

    if (!column || (column as any).project_id !== projectId) {
      return NextResponse.json(
        { error: "Column not found" },
        { status: 404 },
      );
    }

    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "DevTasker",
    };

    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    const importedTasks: any[] = [];

    // If specific issue numbers provided, import those; otherwise import all open issues
    let issues = [];

    if (issueNumbers && issueNumbers.length > 0) {
      // Fetch specific issues
      for (const num of issueNumbers) {
        const res = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/issues/${num}`,
          { headers },
        );
        if (res.ok) {
          const issue = await res.json();
          if (!issue.pull_request) {
            issues.push(issue);
          }
        }
      }
    } else {
      // Fetch all open issues
      const res = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/issues?state=open&per_page=50`,
        { headers },
      );
      if (res.ok) {
        const allIssues = await res.json();
        issues = allIssues.filter((issue: any) => !issue.pull_request);
      }
    }

    // Get the highest position in the column
    const { data: existingTasks } = await supabase
      .from("tasks")
      .select("position")
      .eq("column_id", columnId)
      .order("position", { ascending: false })
      .limit(1);

    let position =
      existingTasks && existingTasks.length > 0
        ? (existingTasks[0] as any).position + 1
        : 0;

    // Create tasks from issues
    for (const issue of issues) {
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({
          column_id: columnId,
          title: issue.title,
          description: issue.body || null,
          position: position++,
        } as any)
        .select()
        .single();

      if (taskError) {
        console.error("Error creating task:", taskError);
        continue;
      }

      // Link task to GitHub issue
      const { error: linkError } = await supabase
        .from("task_github_links")
        .insert({
          task_id: (task as any).id,
          link_type: "issue",
          github_id: `${repoOwner}/${repoName}#${issue.number}`,
          github_number: issue.number,
          github_url: issue.html_url,
          status: issue.state,
        } as any);

      if (linkError) {
        console.error("Error linking task to issue:", linkError);
      }

      importedTasks.push(task);
    }

    return NextResponse.json({
      success: true,
      count: importedTasks.length,
      tasks: importedTasks,
    });
  } catch (error) {
    console.error("Error importing issues:", error);
    return NextResponse.json(
      { error: "Failed to import GitHub issues" },
      { status: 500 },
    );
  }
}
