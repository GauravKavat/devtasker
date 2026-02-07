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
    const repoOwner = searchParams.get("repoOwner");
    const repoName = searchParams.get("repoName");
    const projectId = searchParams.get("projectId");

    if (!repoOwner || !repoName || !projectId) {
      return NextResponse.json(
        { error: "Project ID, repository owner, and name are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const canAccess = await hasPermission(
      supabase as any,
      projectId,
      (dbUser as any).id,
      "github.connect",
    );

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: repoLink } = await supabase
      .from("project_repos")
      .select("id")
      .eq("project_id", projectId)
      .eq("repo_owner", repoOwner)
      .eq("repo_name", repoName)
      .maybeSingle();

    if (!repoLink) {
      return NextResponse.json({ error: "Repository not linked" }, { status: 403 });
    }

    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "DevTasker",
    };

    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    // Fetch workflow runs
    const workflowsRes = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs?per_page=10`,
      { headers }
    );

    if (!workflowsRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch workflow runs" },
        { status: workflowsRes.status }
      );
    }

    const workflowsData = await workflowsRes.json();

    // Transform the data to a simpler format
    const workflows = workflowsData.workflow_runs.map((run: any) => ({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      branch: run.head_branch,
      event: run.event,
      created_at: run.created_at,
      updated_at: run.updated_at,
      html_url: run.html_url,
      actor: {
        login: run.actor.login,
        avatar_url: run.actor.avatar_url,
      },
    }));

    return NextResponse.json({
      workflows,
      total_count: workflowsData.total_count,
    });
  } catch (error) {
    console.error("Error fetching GitHub Actions:", error);
    return NextResponse.json(
      { error: "Failed to fetch GitHub Actions status" },
      { status: 500 }
    );
  }
}
