import { listPublishedPassages } from "../../lib/review-service.mjs";
import { createPassageBlobStore } from "../../lib/netlify-blob-store.mjs";

export default async (request) => {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET" } });
  }

  try {
    const passages = await listPublishedPassages(createPassageBlobStore());
    return Response.json({ passages });
  } catch (error) {
    console.error("Unable to list published passages", error);
    return Response.json({ error: "题库暂时无法读取，请稍后重试。" }, { status: 503 });
  }
};
