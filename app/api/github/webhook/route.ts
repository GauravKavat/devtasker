// @ts-nocheck - Supabase types need regeneration after database schema update
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import crypto from "crypto";

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
