import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 },
      );
    }

    const { data: repos, error } = await supabase
      .from("project_repos")
      .select("*")
      .eq("project_id", projectId);

    if (error) throw error;

    return NextResponse.json({ repos });
  } catch (error) {
    console.error("Error fetching repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { projectId, repoUrl } = await request.json();

    if (!projectId || !repoUrl) {
      return NextResponse.json(
        { error: "Project ID and repository URL are required" },
        { status: 400 },
      );
    }

    // Parse GitHub URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid GitHub repository URL" },
        { status: 400 },
      );
    }

    const [, owner, repo] = match;

    // Fetch repo info from GitHub
    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "DevTasker",
    };

    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers,
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Repository not found or access denied" },
        { status: 404 },
      );
    }

    const repoInfo = await response.json();

    // Insert into database
    const { data, error } = await supabase
      .from("project_repos")
      .insert({
        project_id: projectId,
        repo_url: repoUrl,
        repo_owner: owner,
        repo_name: repo,
        default_branch: repoInfo.default_branch || "main",
      } as any)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ repo: data });
  } catch (error) {
    console.error("Error adding repo:", error);
    return NextResponse.json(
      { error: "Failed to add repository" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get("repoId");

    if (!repoId) {
      return NextResponse.json(
        { error: "Repository ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("project_repos")
      .delete()
      .eq("id", repoId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting repo:", error);
    return NextResponse.json(
      { error: "Failed to delete repository" },
      { status: 500 },
    );
  }
}
