import { strict as assert } from "node:assert";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ZodError } from "zod";
import { parseBulkTaskUpdates, parseTaskUpdate } from "../lib/security/task-updates.ts";
import {
  extractWebhookRepoContext,
  verifyGitHubWebhookSignature,
} from "../lib/security/github-webhook.ts";

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: "parseTaskUpdate accepts valid task fields",
    run: () => {
      const result = parseTaskUpdate({
        title: "Fix auth",
        column_id: "column-1",
        position: 3,
        description: null,
      });

      assert.equal(result.title, "Fix auth");
      assert.equal(result.column_id, "column-1");
      assert.equal(result.position, 3);
      assert.equal(result.description, null);
    },
  },
  {
    name: "parseTaskUpdate rejects unknown keys",
    run: () => {
      assert.throws(() => parseTaskUpdate({ title: "Fix", owner_id: "bad" }), ZodError);
    },
  },
  {
    name: "parseBulkTaskUpdates rejects invalid field types",
    run: () => {
      assert.throws(
        () =>
          parseBulkTaskUpdates({
            updates: [{ id: "task-1", position: "first" }],
          }),
        ZodError,
      );
    },
  },
  {
    name: "parseBulkTaskUpdates preserves valid bulk updates",
    run: () => {
      const updates = parseBulkTaskUpdates({
        updates: [
          { id: "task-1", column_id: "column-2", position: 1 },
          { id: "task-2", title: "Retitle" },
        ],
      });

      assert.equal(updates.length, 2);
      assert.equal(updates[0].column_id, "column-2");
      assert.equal(updates[1].title, "Retitle");
    },
  },
  {
    name: "verifyGitHubWebhookSignature accepts a valid signature",
    run: () => {
      const payload = JSON.stringify({ repository: { owner: { login: "acme" }, name: "repo" } });
      const secret = "super-secret";
      const signature = `sha256=${crypto.createHmac("sha256", secret).update(payload).digest("hex")}`;

      assert.equal(verifyGitHubWebhookSignature(payload, signature, secret), true);
    },
  },
  {
    name: "verifyGitHubWebhookSignature rejects an invalid signature",
    run: () => {
      const payload = JSON.stringify({ hello: "world" });
      assert.equal(
        verifyGitHubWebhookSignature(
          payload,
          "sha256=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "secret",
        ),
        false,
      );
    },
  },
  {
    name: "extractWebhookRepoContext returns repository coordinates",
    run: () => {
      const context = extractWebhookRepoContext({
        repository: {
          owner: { login: "octocat" },
          name: "hello-world",
        },
      });

      assert.deepEqual(context, {
        repoOwner: "octocat",
        repoName: "hello-world",
      });
    },
  },
  {
    name: "server routes no longer import the browser Supabase singleton",
    run: () => {
      const routeFiles = [
        resolve("app/api/invitations/accept/route.ts"),
        resolve("app/api/invitations/create/route.ts"),
        resolve("app/api/projects/[projectId]/members/route.ts"),
        resolve("app/api/projects/[projectId]/roles/route.ts"),
      ];

      for (const file of routeFiles) {
        const contents = readFileSync(file, "utf8");
        assert.equal(contents.includes("getSupabaseClient"), false, `${file} still references getSupabaseClient`);
        assert.equal(contents.includes("@/lib/supabase/server"), true, `${file} must use the server client`);
      }
    },
  },
  {
    name: "task routes reference strict payload validation and destination checks",
    run: () => {
      const taskRoute = readFileSync(resolve("app/api/tasks/[taskId]/route.ts"), "utf8");
      const bulkRoute = readFileSync(resolve("app/api/tasks/bulk-update/route.ts"), "utf8");

      assert.equal(taskRoute.includes("parseTaskUpdate"), true);
      assert.equal(taskRoute.includes("getProjectIdForColumn"), true);
      assert.equal(bulkRoute.includes("parseBulkTaskUpdates"), true);
      assert.equal(bulkRoute.includes("Destination column not found"), true);
    },
  },
  {
    name: "webhook route verifies requests using stored webhook ids",
    run: () => {
      const webhookRoute = readFileSync(resolve("app/api/github/webhook/route.ts"), "utf8");

      assert.equal(webhookRoute.includes("x-github-hook-id"), true);
      assert.equal(webhookRoute.includes("verifyGitHubWebhookSignature"), true);
      assert.equal(webhookRoute.includes("Webhook not found"), true);
    },
  },
];

let failures = 0;
for (const test of tests) {
  try {
    test.run();
    console.log(`PASS ${test.name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${test.name}`);
    console.error(error);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log(`All ${tests.length} security checks passed.`);
}
