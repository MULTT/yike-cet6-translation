import { reviewCandidate } from "../../lib/review-service.mjs";
import { candidateKey, createPassageBlobStore } from "../../lib/netlify-blob-store.mjs";
import { getUser } from "@netlify/identity";
import { isAdminUser } from "../../lib/admin-auth.mjs";

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new TypeError("请求内容必须是 JSON。");
  }
}

export default async (request) => {
  const user = await getUser();
  if (!user) return Response.json({ error: "请先以管理员身份登录。" }, { status: 401 });
  if (!isAdminUser(user)) return Response.json({ error: "当前账号没有审核权限。" }, { status: 403 });
  const reviewer = user.email || user.id;

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
    const { id, decision, sourceVerified, rejectionReason } = await readJson(request);
    if (decision === "reject" && !String(rejectionReason || "").trim()) {
      return Response.json({ error: "拒绝候选题时请填写原因。" }, { status: 400 });
    }
    if (sourceVerified === true) {
      const candidate = await store.get(candidateKey(id));
      if (!candidate || candidate.status !== "pending") {
        return Response.json({ error: "待审核题目不存在或状态已变更。" }, { status: 409 });
      }
      await store.set(candidateKey(id), {
        ...candidate,
        sourceVerified: true,
        sourceVerifiedAt: new Date().toISOString(),
        sourceVerifier: reviewer,
      });
    }
    const candidate = await reviewCandidate(store, id, decision, reviewer);
    if (decision === "reject") {
      candidate.rejectionReason = String(rejectionReason).trim();
      await store.set(candidateKey(id), candidate);
    }
    return Response.json({ candidate });
  } catch (error) {
    const message = error instanceof Error ? error.message : "审核失败。";
    const status = /not found|pending|verified/i.test(message) ? 409 : 400;
    return Response.json({ error: message }, { status });
  }
};
