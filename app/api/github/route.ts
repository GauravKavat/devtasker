import { NextRequest, NextResponse } from "next/server";

interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
  parents: { sha: string }[];
}

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  mergeable_state?: string;
  merged: boolean;
  merge_commit_sha: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { repoUrl, action } = await request.json();

    if (!repoUrl) {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 },
      );
    }

    // Parse GitHub URL to extract owner and repo name
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    if (!match) {
      return NextResponse.json(
        {
          error:
            "Invalid GitHub repository URL. Use format: https://github.com/owner/repo",
        },
        { status: 400 },
      );
    }

    const [, owner, repo] = match;
    const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;

    // Setup headers for GitHub API
    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "DevTasker-VCS-Viewer",
    };

    // Add GitHub token if available (REQUIRED for private repos!)
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
      console.log("✅ Using GitHub token for authentication");
    } else {
      console.warn("⚠️ No GitHub token found - only public repos will work");
    }

    // Helper function to handle API errors
    const handleApiError = async (response: Response) => {
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));

        if (response.status === 404) {
          throw new Error(
            "Repository not found. Make sure the URL is correct and you have access to it.",
          );
        } else if (response.status === 401) {
          throw new Error("Authentication failed. Check your GitHub token.");
        } else if (response.status === 403) {
          throw new Error(
            "Access denied. Your token may not have permission to access this private repository.",
          );
        }

        throw new Error(
          error.message || `GitHub API error: ${response.statusText}`,
        );
      }
    };

    switch (action) {
      case "commits": {
        const response = await fetch(`${baseUrl}/commits?per_page=50`, {
          headers,
        });
        await handleApiError(response);
        const commits: GitHubCommit[] = await response.json();
        return NextResponse.json({ commits });
      }

      case "branches": {
        const response = await fetch(`${baseUrl}/branches`, { headers });
        await handleApiError(response);
        const branches: GitHubBranch[] = await response.json();
        return NextResponse.json({ branches });
      }

      case "releases": {
        const response = await fetch(`${baseUrl}/releases`, { headers });
        await handleApiError(response);
        const releases: GitHubRelease[] = await response.json();
        return NextResponse.json({ releases });
      }

      case "pullRequests": {
        const response = await fetch(`${baseUrl}/pulls?state=all&per_page=50`, {
          headers,
        });
        await handleApiError(response);
        const pullRequests: GitHubPullRequest[] = await response.json();
        return NextResponse.json({ pullRequests });
      }

      case "repoInfo": {
        const response = await fetch(baseUrl, { headers });
        await handleApiError(response);
        const repoInfo = await response.json();
        return NextResponse.json({ repoInfo });
      }

      case "all": {
        // Fetch all data in parallel for better performance
        const [
          commitsRes,
          branchesRes,
          releasesRes,
          pullRequestsRes,
          repoInfoRes,
        ] = await Promise.all([
          fetch(`${baseUrl}/commits?per_page=50`, { headers }),
          fetch(`${baseUrl}/branches`, { headers }),
          fetch(`${baseUrl}/releases`, { headers }),
          fetch(`${baseUrl}/pulls?state=all&per_page=50`, { headers }),
          fetch(baseUrl, { headers }),
        ]);

        // Check for errors
        await handleApiError(repoInfoRes);

        const [commits, branches, releases, pullRequests, repoInfo] =
          await Promise.all([
            commitsRes.ok ? commitsRes.json() : [],
            branchesRes.ok ? branchesRes.json() : [],
            releasesRes.ok ? releasesRes.json() : [],
            pullRequestsRes.ok ? pullRequestsRes.json() : [],
            repoInfoRes.ok ? repoInfoRes.json() : null,
          ]);

        return NextResponse.json({
          commits,
          branches,
          releases,
          pullRequests,
          repoInfo,
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action specified" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("GitHub API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    );
  }
}
