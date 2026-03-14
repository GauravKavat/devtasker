import test from "node:test";
import assert from "node:assert/strict";
import {
  extractWebhookRepoContext,
  verifyGitHubWebhookSignature,
} from "../../lib/security/github-webhook.ts";

test("verifyGitHubWebhookSignature accepts a valid signature", () => {
  const payload = JSON.stringify({ repository: { owner: { login: "acme" }, name: "repo" } });
  const secret = "super-secret";
  const signature = "sha256=85d302182dc3874d1f5174614d9865cb7d93cc695fd72cbec1222f2715f93f7c";

  assert.equal(verifyGitHubWebhookSignature(payload, signature, secret), true);
});

test("verifyGitHubWebhookSignature rejects an invalid signature", () => {
  const payload = JSON.stringify({ hello: "world" });

  assert.equal(
    verifyGitHubWebhookSignature(payload, "sha256=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "secret"),
    false,
  );
});

test("extractWebhookRepoContext returns repository coordinates", () => {
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
});
