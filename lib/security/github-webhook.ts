import crypto from "crypto";

export type GitHubWebhookPayload = {
  repository?: {
    owner?: {
      login?: string;
    };
    name?: string;
  };
};

export function verifyGitHubWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = `sha256=${hmac.update(payload).digest("hex")}`;

  if (signature.length !== digest.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export function extractWebhookRepoContext(payload: GitHubWebhookPayload) {
  return {
    repoOwner: payload.repository?.owner?.login ?? null,
    repoName: payload.repository?.name ?? null,
  };
}
