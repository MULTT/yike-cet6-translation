import { getStore } from "@netlify/blobs";

import { createUserPaper, listUserPapers, saveUserPaper } from "../../lib/user-paper-store.mjs";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const STORE_NAME = "cet6-passage-library";

function createUserPaperBlobStore() {
  const blobs = getStore({ name: STORE_NAME, consistency: "strong" });

  return {
    async set(key, value) {
      await blobs.setJSON(key, value);
    },
    async list(prefix = "") {
      const { blobs: entries } = await blobs.list({ prefix });
      return Promise.all(entries.map(async ({ key }) => ({
        key,
        value: await blobs.get(key, { type: "json", consistency: "strong" }),
      })));
    },
    async setImage(key, image) {
      await blobs.set(key, image, { metadata: { contentType: image.type } });
    },
    async getImage(key) {
      return blobs.get(key, { type: "blob", consistency: "strong" });
    },
  };
}

function formInteger(value) {
  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) return NaN;
  return Number(value.trim());
}

function validateImage(image) {
  if (!image || typeof image !== "object" || typeof image.size !== "number") {
    return "请上传题目图片。";
  }
  if (typeof image.type !== "string" || !image.type.startsWith("image/")) {
    return "只能上传图片文件。";
  }
  if (image.size > MAX_IMAGE_SIZE) {
    return "图片不能超过 8MB。";
  }
  return null;
}

function inputError(error) {
  return Response.json({ error }, { status: 400 });
}

export function createUserPapersHandler(store = createUserPaperBlobStore()) {
  return async (request) => {
    if (request.method === "GET") {
      const imageId = new URL(request.url).searchParams.get("image");
      if (imageId) {
        try {
          const image = await store.getImage(`user-paper-image:${imageId}`);
          if (!image) return new Response("Image not found", { status: 404 });
          return new Response(image, { headers: { "Content-Type": image.type || "application/octet-stream" } });
        } catch (error) {
          console.error("Unable to read user paper image", error);
          return new Response("Image not found", { status: 404 });
        }
      }
      try {
        return Response.json({ papers: await listUserPapers(store) });
      } catch (error) {
        console.error("Unable to list user papers", error);
        return Response.json({ error: "用户上传题目暂时无法读取，请稍后重试。" }, { status: 503 });
      }
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, POST" } });
    }

    let formData;
    try {
      formData = await request.formData();
    } catch {
      return inputError("请使用图片上传表单提交题目。");
    }

    const image = formData.get("image");
    const imageError = validateImage(image);
    if (imageError) return inputError(imageError);

    const year = formInteger(formData.get("year"));
    const month = formInteger(formData.get("month"));
    let paper;
    try {
      paper = createUserPaper({
        year,
        month,
        imageKey: "user-paper-image:pending",
        ocrText: formData.get("ocrText"),
      });
    } catch (error) {
      return inputError(error instanceof Error ? error.message : "题目资料无效。");
    }

    const savedPaper = { ...paper, imageKey: `user-paper-image:${paper.id}` };
    try {
      await store.setImage(savedPaper.imageKey, image);
      await saveUserPaper(store, savedPaper);
      return Response.json({ paper: savedPaper }, { status: 201 });
    } catch (error) {
      console.error("Unable to save user paper", error);
      return Response.json({ error: "用户上传题目暂时无法保存，请稍后重试。" }, { status: 503 });
    }
  };
}

export default async (request) => createUserPapersHandler()(request);
