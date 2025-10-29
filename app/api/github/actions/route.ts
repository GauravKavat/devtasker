import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoOwner = searchParams.get("repoOwner");
    const repoName = searchParams.get("repoName");

    if (!repoOwner || !repoName) {
      return NextResponse.json(
        { error: "Repository owner and name are required" },
        { status: 400 }
      );
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
