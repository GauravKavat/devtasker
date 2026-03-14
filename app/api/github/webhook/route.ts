import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { ensureUser, hasPermission } from "@/lib/rbac";
import {
  extractWebhookRepoContext,
  verifyGitHubWebhookSignature,
} from "@/lib/security/github-webhook";

const DEFAULT_EVENTS = ["issues", "pull_request", "push"];

type StoredWebhook = {
  repo_owner: string | null;
  repo_name: string | null;
  secret: string;
  active: boolean;
};

function getWebhookUrl(repoOwner?: string, repoName?: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = new URL(`${appUrl}/api/github/webhook`);

  if (repoOwner && repoName) {
    url.searchParams.set("repoOwner", repoOwner);
    url.searchParams.set("repoName", repoName);
  }

  return url.toString();
}

function getGitHubHeaders() {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("GitHub token not configured");
  }

  return {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "DevTasker",
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
  } as HeadersInit;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("x-hub-signature-256");
    const event = headersList.get("x-github-event");
    const hookId = headersList.get("x-github-hook-id");

    if (!signature || !event || !hookId) {
      return NextResponse.json(
        { error: "Missing GitHub webhook headers" },
        { status: 400 },
      );
    }

    const payload = JSON.parse(body);
    const { repoOwner, repoName } = extractWebhookRepoContext(payload);

    const { data: webhook, error: webhookError } = await supabase
      .from("github_webhooks")
      .select("id, repo_owner, repo_name, secret, active")
      .eq("webhook_id", hookId)
      .maybeSingle();

    const storedWebhook = webhook as StoredWebhook | null;

    if (webhookError) {
      throw webhookError;
    }

    if (!storedWebhook || !storedWebhook.active) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    if (
      (storedWebhook.repo_owner && storedWebhook.repo_owner !== repoOwner) ||
      (storedWebhook.repo_name && storedWebhook.repo_name !== repoName)
    ) {
      return NextResponse.json({ error: "Webhook repository mismatch" }, { status: 401 });
    }

    if (!verifyGitHubWebhookSignature(body, signature, storedWebhook.secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    switch (event) {
      case "pull_request": {
        const { action, pull_request, repository } = payload;
        const prNumber = pull_request.number;
        const repoFullName = repository.full_name;

        const { data: links } = await supabase
          .from("task_github_links")
          .select("*, tasks!inner(id, column_id)")
          .eq("link_type", "pr")
          .eq("github_number", prNumber)
          .like("github_id", `${repoFullName}%`);

        if (!links || links.length === 0) {
          break;
        }

        let status = pull_request.state;
        if (pull_request.merged) {
          status = "merged";
        } else if (pull_request.draft) {
          status = "draft";
        }

        for (const link of links as any[]) {
          await (supabase.from("task_github_links") as any)
            .update({ status })
            .eq("id", link.id);

          if (action === "closed" && pull_request.merged) {
            const { data: project } = await supabase
              .from("columns")
              .select("project_id")
              .eq("id", link.tasks.column_id)
              .single();

            if (project) {
              const { data: doneColumn } = await supabase
                .from("columns")
                .select("id")
                .eq("project_id", (project as any).project_id)
                .ilike("name", "%done%")
                .limit(1)
                .single();

              if (doneColumn) {
                await (supabase.from("tasks") as any)
                  .update({ column_id: (doneColumn as any).id })
                  .eq("id", (link as any).tasks.id);
              }
            }
          }
        }
        break;
      }

      case "issues": {
        const { action, issue, repository } = payload;
        const issueNumber = issue.number;
        const repoFullName = repository.full_name;

        const { data: links } = await supabase
          .from("task_github_links")
          .select("*, tasks!inner(id, column_id)")
          .eq("link_type", "issue")
          .eq("github_number", issueNumber)
          .like("github_id", `${repoFullName}%`);

        if (!links || links.length === 0) {
          break;
        }

        const status = issue.state;

        for (const link of links as any[]) {
          await (supabase.from("task_github_links") as any)
            .update({ status })
            .eq("id", link.id);

          if (action === "closed") {
            const { data: project } = await supabase
              .from("columns")
              .select("project_id")
              .eq("id", link.tasks.column_id)
              .single();

            if (project) {
              const { data: doneColumn } = await supabase
                .from("columns")
                .select("id")
                .eq("project_id", (project as any).project_id)
                .ilike("name", "%done%")
                .limit(1)
                .single();

              if (doneColumn) {
                await (supabase.from("tasks") as any)
                  .update({ column_id: (doneColumn as any).id })
                  .eq("id", (link as any).tasks.id);
              }
            }
          }
        }
        break;
      }

      case "push": {
        const { commits } = payload;

        for (const commit of commits) {
          const message = commit.message.toLowerCase();
          const taskIdMatch = message.match(/dt-([a-f0-9-]{36})/i);

          if (taskIdMatch) {
            const taskId = taskIdMatch[1];

            await supabase.from("github_commits").upsert(
              {
                task_id: taskId,
                commit_sha: commit.id,
                commit_message: commit.message,
                commit_url: commit.url,
                author: commit.author.username || commit.author.name,
                committed_at: commit.timestamp,
              } as any,
              {
                onConflict: "task_id,commit_sha",
              },
            );
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event: ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const repoOwner = searchParams.get("repoOwner");
    const repoName = searchParams.get("repoName");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 },
      );
    }

    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
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

    let query = supabase
      .from("github_webhooks")
      .select("*")
      .eq("project_id", projectId);

    if (repoOwner && repoName) {
      query = query.eq("repo_owner", repoOwner).eq("repo_name", repoName);
    }

    const { data: webhooks, error } = await query;

    if (error) throw error;

    return NextResponse.json({ webhooks: webhooks || [] });
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhooks" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { projectId, repoOwner, repoName, webhookUrl, events } =
      await request.json();

    if (!projectId || !repoOwner || !repoName) {
      return NextResponse.json(
        { error: "Project ID, repository owner, and name are required" },
        { status: 400 },
      );
    }

    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
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

    const headers = getGitHubHeaders();
    const secret = crypto.randomBytes(32).toString("hex");
    const targetUrl = webhookUrl || getWebhookUrl(repoOwner, repoName);
    const eventList = Array.isArray(events) && events.length > 0 ? events : DEFAULT_EVENTS;

    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/hooks`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: "web",
          active: true,
          events: eventList,
          config: {
            url: targetUrl,
            content_type: "json",
            secret,
          },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.message || "Failed to create webhook" },
        { status: response.status },
      );
    }

    const webhookData = await response.json();

    const { data, error } = await supabase
      .from("github_webhooks")
      .insert({
        project_id: projectId,
        repo_owner: repoOwner,
        repo_name: repoName,
        webhook_id: String(webhookData.id),
        webhook_url: targetUrl,
        secret,
        active: true,
      } as any)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ webhook: data });
  } catch (error) {
    console.error("Error creating webhook:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create webhook" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const repoOwner = searchParams.get("repoOwner");
    const repoName = searchParams.get("repoName");
    const webhookId = searchParams.get("webhookId");

    if (!projectId || !repoOwner || !repoName || !webhookId) {
      return NextResponse.json(
        { error: "Project ID, repository owner, name, and webhook ID are required" },
        { status: 400 },
      );
    }

    const dbUser = await ensureUser(supabase as any, userId);

    if (!dbUser) {
      return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
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

    const headers = getGitHubHeaders();

    const response = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/hooks/${webhookId}`,
      {
        method: "DELETE",
        headers,
      },
    );

    if (!response.ok && response.status !== 404) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.message || "Failed to delete webhook" },
        { status: response.status },
      );
    }

    const { error } = await supabase
      .from("github_webhooks")
      .delete()
      .eq("project_id", projectId)
      .eq("webhook_id", webhookId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete webhook" },
      { status: 500 },
    );
  }
}
