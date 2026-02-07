import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUser, getProjectIdForTask, getProjectIdForTaskLink, hasPermission } from "@/lib/rbac";

// Link a task to a GitHub issue/PR
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { taskId, linkType, githubUrl, projectId } = await request.json();

    if (!taskId || !linkType || !githubUrl) {
      return NextResponse.json(
        { error: "Task ID, link type, and GitHub URL are required" },
        { status: 400 },
      );
    }

    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const resolvedProjectId = await getProjectIdForTask(supabase as any, taskId);

    if (!resolvedProjectId) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const canConnect = await hasPermission(
      supabase as any,
      resolvedProjectId,
      (dbUser as any).id,
      "github.connect",
    );

    if (!canConnect) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse GitHub URL to extract info
    let githubId = "";
    let githubNumber = null;
    let owner = "";
    let repo = "";

    if (linkType === "issue" || linkType === "pr") {
      const match = githubUrl.match(
        /github\.com\/([^\/]+)\/([^\/]+)\/(issues|pull)\/(\d+)/,
      );
      if (!match) {
        return NextResponse.json(
          { error: "Invalid GitHub issue/PR URL" },
          { status: 400 },
        );
      }
      [, owner, repo, , githubNumber] = match;
      githubId = `${owner}/${repo}#${githubNumber}`;
    } else if (linkType === "commit") {
      const match = githubUrl.match(
        /github\.com\/([^\/]+)\/([^\/]+)\/commit\/([a-f0-9]+)/,
      );
      if (!match) {
        return NextResponse.json(
          { error: "Invalid GitHub commit URL" },
          { status: 400 },
        );
      }
      [, owner, repo, githubId] = match;
    }

    // Fetch status from GitHub
    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "DevTasker",
    };

    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    let status = null;
    if (linkType === "issue" && githubNumber) {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/issues/${githubNumber}`,
        { headers },
      );
      if (res.ok) {
        const issue = await res.json();
        status = issue.state;
      }
    } else if (linkType === "pr" && githubNumber) {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${githubNumber}`,
        { headers },
      );
      if (res.ok) {
        const pr = await res.json();
        status = pr.merged ? "merged" : pr.state;
      }
    }

    // Insert link
    const { data, error } = await supabase
      .from("task_github_links")
      .insert({
        task_id: taskId,
        link_type: linkType,
        github_id: githubId,
        github_number: githubNumber ? parseInt(githubNumber) : null,
        github_url: githubUrl,
        status,
      } as any)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ link: data });
  } catch (error) {
    console.error("Error linking task:", error);
    return NextResponse.json(
      { error: "Failed to link task to GitHub" },
      { status: 500 },
    );
  }
}

// Get GitHub links for a task
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 },
      );
    }

    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const projectId = await getProjectIdForTask(supabase as any, taskId);

    if (!projectId) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const canConnect = await hasPermission(
      supabase as any,
      projectId,
      (dbUser as any).id,
      "github.connect",
    );

    if (!canConnect) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: links, error } = await supabase
      .from("task_github_links")
      .select("*")
      .eq("task_id", taskId);

    if (error) throw error;

    return NextResponse.json({ links });
  } catch (error) {
    console.error("Error fetching links:", error);
    return NextResponse.json(
      { error: "Failed to fetch GitHub links" },
      { status: 500 },
    );
  }
}

// Delete a GitHub link
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get("linkId");

    if (!linkId) {
      return NextResponse.json(
        { error: "Link ID is required" },
        { status: 400 },
      );
    }

    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const projectId = await getProjectIdForTaskLink(supabase as any, linkId);

    if (!projectId) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const canConnect = await hasPermission(
      supabase as any,
      projectId,
      (dbUser as any).id,
      "github.connect",
    );

    if (!canConnect) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("task_github_links")
      .delete()
      .eq("id", linkId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting link:", error);
    return NextResponse.json(
      { error: "Failed to delete link" },
      { status: 500 },
    );
  }
}
