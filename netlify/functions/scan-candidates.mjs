import { queueCandidate } from "../../lib/review-service.mjs";
import { createPassageBlobStore } from "../../lib/netlify-blob-store.mjs";
import { canAutoPublish } from "../../lib/auto-publish-policy.mjs";
import { reviewCandidate } from "../../lib/review-service.mjs";

export const config = { schedule: "@daily" };

function isSecureUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export default async () => {
  const store = createPassageBlobStore();
  const feedUrl = process.env.CET6_CANDIDATE_FEED_URL;
  const scan = { scannedAt: new Date().toISOString(), published: 0, skipped: 0, errors: [] };

  try {
    if (!isSecureUrl(feedUrl)) {
      scan.errors.push("未配置可信的 HTTPS 候选题源；本次未新增题目。");
      await store.set("scan-log:latest", scan);
      return Response.json(scan, { status: 202 });
    }

    const response = await fetch(feedUrl, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`候选题源请求失败（${response.status}）。`);
    const payload = await response.json();
    const candidates = Array.isArray(payload) ? payload : payload?.candidates;
    if (!Array.isArray(candidates)) throw new Error("候选题源未返回 candidates 数组。");

    for (const candidate of candidates) {
      try {
        if (!canAutoPublish(candidate)) throw new Error("候选题未通过自动发布来源与完整性校验。");
        const queued = await queueCandidate(store, { ...candidate, sourceVerified: true });
        await reviewCandidate(store, queued.id, "publish", "automatic-source-policy");
        scan.published += 1;
      } catch (error) {
        scan.skipped += 1;
        scan.errors.push(error instanceof Error ? error.message : "候选题处理失败。");
      }
    }
    await store.set("scan-log:latest", scan);
    return Response.json(scan);
  } catch (error) {
    scan.errors.push(error instanceof Error ? error.message : "每日扫描失败。");
    await store.set("scan-log:latest", scan);
    return Response.json(scan, { status: 502 });
  }
};
