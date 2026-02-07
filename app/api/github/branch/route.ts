import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUser, getProjectIdForTask, hasPermission } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId, repoOwner, repoName, branchName, baseBranch = "main" } = await request.json();

    if (!taskId || !repoOwner || !repoName || !branchName) {
      return NextResponse.json(
        { error: "Task ID, repository owner, name, and branch name are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
    }

    const projectId = await getProjectIdForTask(supabase as any, taskId);

    if (!projectId) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const canCreateBranch = await hasPermission(
      supabase as any,
      projectId,
      (dbUser as any).id,
      "github.branch",
    );

    if (!canCreateBranch) {
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

    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "GitHub token not configured" },
        { status: 500 }
      );
    }

    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "DevTasker",
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
    };

    // Get the SHA of the base branch
    const baseRef = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/git/ref/heads/${baseBranch}`,
      { headers }
    );

    if (!baseRef.ok) {
      return NextResponse.json(
        { error: `Base branch '${baseBranch}' not found` },
        { status: 404 }
      );
    }

    const baseRefData = await baseRef.json();
    const baseSha = baseRefData.object.sha;

    // Create the new branch
    const createBranch = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/git/refs`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        }),
      }
    );

    if (!createBranch.ok) {
      const error = await createBranch.json();
      return NextResponse.json(
        { error: error.message || "Failed to create branch" },
        { status: createBranch.status }
      );
    }

    const branchData = await createBranch.json();

    return NextResponse.json({
      success: true,
      branch: {
        name: branchName,
        ref: branchData.ref,
        url: `https://github.com/${repoOwner}/${repoName}/tree/${branchName}`,
      },
    });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json(
      { error: "Failed to create branch" },
      { status: 500 }
    );
  }
}
