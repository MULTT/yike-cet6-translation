import { reviewCandidate } from "../../lib/review-service.mjs";
import { candidateKey, createPassageBlobStore } from "../../lib/netlify-blob-store.mjs";

function isAuthorized(request) {
  const configuredToken = process.env.ADMIN_REVIEW_TOKEN;
  const suppliedToken = request.headers.get("x-admin-review-token")
    || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(configuredToken && suppliedToken && suppliedToken === configuredToken);
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new TypeError("请求内容必须是 JSON。");
  }
}

export default async (request) => {
  if (!isAuthorized(request)) {
    return Response.json({ error: "管理员身份验证失败。" }, { status: 401 });
  }

  const store = createPassageBlobStore();
  if (request.method === "GET") {
    const entries = await store.list("review-candidate:");
    const candidates = entries.map((entry) => entry.value).filter((item) => item?.status === "pending");
    return Response.json({ candidates });
  }
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, POST" } });
  }

  try {
    const { id, decision, reviewer, sourceVerified } = await readJson(request);
    if (sourceVerified === true) {
      const candidate = await store.get(candidateKey(id));
      if (!candidate || candidate.status !== "pending") {
        return Response.json({ error: "待审核题目不存在或状态已变更。" }, { status: 409 });
      }
      await store.set(candidateKey(id), {
        ...candidate,
        sourceVerified: true,
        sourceVerifiedAt: new Date().toISOString(),
        sourceVerifier: String(reviewer || "").trim(),
      });
    }
    const candidate = await reviewCandidate(store, id, decision, reviewer);
    return Response.json({ candidate });
  } catch (error) {
    const message = error instanceof Error ? error.message : "审核失败。";
    const status = /not found|pending|verified/i.test(message) ? 409 : 400;
    return Response.json({ error: message }, { status });
  }
};
