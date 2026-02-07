// @ts-nocheck - Supabase types need regeneration after database schema update
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import crypto from "crypto";

const DEFAULT_EVENTS = ["issues", "pull_request", "push"];

function getWebhookUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}/api/github/webhook`;
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

function verifySignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.text();
    const headersList = await headers();

    const signature = headersList.get("x-hub-signature-256");
    const event = headersList.get("x-github-event");

    if (!signature || !event) {
      return NextResponse.json(
        { error: "Missing GitHub webhook headers" },
        { status: 400 },
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (webhookSecret && !verifySignature(body, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);

    // Handle different GitHub events
    switch (event) {
      case "pull_request": {
        const { action, pull_request, repository } = payload;
        const prNumber = pull_request.number;
        const prUrl = pull_request.html_url;
        const repoFullName = repository.full_name;

        // Find linked tasks
        const { data: links } = await supabase
          .from("task_github_links")
          .select("*, tasks!inner(id, column_id)")
          .eq("link_type", "pr")
          .eq("github_number", prNumber)
          .like("github_id", `${repoFullName}%`);

        if (!links || links.length === 0) break;

        // Update PR status
        let status = pull_request.state;
        if (pull_request.merged) {
          status = "merged";
        } else if (pull_request.draft) {
          status = "draft";
        }

        for (const link of links as any[]) {
          await supabase
            .from("task_github_links")
            .update({ status })
            .eq("id", link.id);

          // Move task to "Done" column if PR is merged
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
                await supabase
                  .from("tasks")
                  .update({ column_id: doneColumn.id })
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

        // Find linked tasks
        const { data: links } = await supabase
          .from("task_github_links")
          .select("*, tasks!inner(id, column_id)")
          .eq("link_type", "issue")
          .eq("github_number", issueNumber)
          .like("github_id", `${repoFullName}%`);

        if (!links || links.length === 0) break;

        // Update issue status
        const status = issue.state;

        for (const link of links as any[]) {
          await supabase
            .from("task_github_links")
            .update({ status })
            .eq("id", link.id);

          // Move task to "Done" column if issue is closed
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
                await supabase
                  .from("tasks")
                  .update({ column_id: doneColumn.id })
                  .eq("id", (link as any).tasks.id);
              }
            }
          }
        }
        break;
      }

      case "push": {
        const { commits, repository, ref } = payload;
        const repoFullName = repository.full_name;

        // Extract task IDs from commit messages (e.g., "fixes #123" or "DT-uuid")
        for (const commit of commits) {
          const message = commit.message.toLowerCase();
          const taskIdMatch = message.match(/dt-([a-f0-9-]{36})/i);

          if (taskIdMatch) {
            const taskId = taskIdMatch[1];

            // Add commit to task
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
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 },
      );
    }

    const { data: webhooks, error } = await supabase
      .from("github_webhooks")
      .select("*")
      .eq("project_id", projectId);

    if (error) throw error;

    return NextResponse.json({ webhooks });
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
    const supabase = await createClient();
    const { projectId, repoOwner, repoName, webhookUrl, events } =
      await request.json();

    if (!projectId || !repoOwner || !repoName) {
      return NextResponse.json(
        { error: "Project ID, repository owner, and name are required" },
        { status: 400 },
      );
    }

    const headers = getGitHubHeaders();
    const secret = process.env.GITHUB_WEBHOOK_SECRET || crypto.randomBytes(32).toString("hex");
    const targetUrl = webhookUrl || getWebhookUrl();
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
