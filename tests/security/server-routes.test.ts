import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const routeFiles = [
  resolve("app/api/invitations/accept/route.ts"),
  resolve("app/api/invitations/create/route.ts"),
  resolve("app/api/projects/[projectId]/members/route.ts"),
  resolve("app/api/projects/[projectId]/roles/route.ts"),
];

test("server routes no longer import the browser Supabase singleton", () => {
  for (const file of routeFiles) {
    const contents = readFileSync(file, "utf8");
    assert.equal(contents.includes("getSupabaseClient"), false, `${file} still references getSupabaseClient`);
    assert.equal(contents.includes("@/lib/supabase/server"), true, `${file} must use the server client`);
  }
});

test("task routes enforce strict payload validation hooks", () => {
  const taskRoute = readFileSync(resolve("app/api/tasks/[taskId]/route.ts"), "utf8");
  const bulkRoute = readFileSync(resolve("app/api/tasks/bulk-update/route.ts"), "utf8");

  assert.equal(taskRoute.includes("parseTaskUpdate"), true);
  assert.equal(taskRoute.includes("getProjectIdForColumn"), true);
  assert.equal(bulkRoute.includes("parseBulkTaskUpdates"), true);
  assert.equal(bulkRoute.includes("Destination column not found"), true);
});

test("webhook route verifies requests using stored webhook ids", () => {
  const webhookRoute = readFileSync(resolve("app/api/github/webhook/route.ts"), "utf8");

  assert.equal(webhookRoute.includes("x-github-hook-id"), true);
  assert.equal(webhookRoute.includes("verifyGitHubWebhookSignature"), true);
  assert.equal(webhookRoute.includes("Webhook not found"), true);
});
