import assert from "node:assert/strict";
import test from "node:test";

import { createUserPapersHandler } from "./user-papers.mjs";

function createStore() {
  const records = new Map();
  const images = new Map();

  return {
    images,
    async set(key, value) {
      records.set(key, structuredClone(value));
    },
    async list(prefix = "") {
      return [...records.entries()]
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, value]) => ({ key, value: structuredClone(value) }));
    },
    async setImage(key, image) {
      images.set(key, image);
    },
    async getImage(key) {
      return images.get(key) || null;
    },
  };
}

function uploadRequest(fields = {}) {
  const { image, ocrText } = fields;
  const year = Object.hasOwn(fields, "year") ? fields.year : "2025";
  const month = Object.hasOwn(fields, "month") ? fields.month : "6";
  const body = new FormData();
  if (image !== undefined) body.append("image", image, "paper.png");
  if (year !== undefined) body.append("year", year);
  if (month !== undefined) body.append("month", month);
  if (ocrText !== undefined) body.append("ocrText", ocrText);
  return new Request("https://example.test/api/user-papers", { method: "POST", body });
}

test("GET lists only uploaded-paper records", async () => {
  const store = createStore();
  await store.set("user-paper:one", { id: "one", kind: "user-upload" });
  await store.set("answer-image:one", { id: "one", kind: "answer" });
  const response = await createUserPapersHandler(store)(new Request("https://example.test/api/user-papers"));

  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).papers, [{ id: "one", kind: "user-upload" }]);
});

test("POST rejects a request without an image", async () => {
  const response = await createUserPapersHandler(createStore())(uploadRequest({ image: undefined }));

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /图片/);
});

test("POST rejects a request without a year", async () => {
  const response = await createUserPapersHandler(createStore())(uploadRequest({ image: new Blob(["x"], { type: "image/png" }), year: undefined }));

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /year/i);
});

test("POST rejects an invalid exam month", async () => {
  const response = await createUserPapersHandler(createStore())(uploadRequest({ image: new Blob(["x"], { type: "image/png" }), month: "7" }));

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /month/i);
});

test("POST rejects a non-image upload", async () => {
  const response = await createUserPapersHandler(createStore())(uploadRequest({ image: new Blob(["x"], { type: "text/plain" }) }));

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /图片/);
});

test("POST rejects an image larger than 8MB", async () => {
  const tooLarge = new Blob([new Uint8Array(8 * 1024 * 1024 + 1)], { type: "image/png" });
  const response = await createUserPapersHandler(createStore())(uploadRequest({ image: tooLarge }));

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /8MB/i);
});

test("POST saves an image and its record in dedicated user-paper namespaces", async () => {
  const store = createStore();
  const response = await createUserPapersHandler(store)(uploadRequest({
    image: new Blob(["image"], { type: "image/png" }),
    ocrText: "  已校对文字。  ",
  }));

  assert.equal(response.status, 201);
  const { paper } = await response.json();
  assert.equal(paper.kind, "user-upload");
  assert.equal(paper.ocrText, "已校对文字。");
  assert.equal(paper.imageKey, `user-paper-image:${paper.id}`);
  assert.equal(store.images.has(paper.imageKey), true);
  assert.equal((await store.list(`user-paper:${paper.id}`)).length, 1);
});

test("GET returns only the requested uploaded-paper image", async () => {
  const store = createStore();
  await store.setImage("user-paper-image:paper-1", new Blob(["question image"], { type: "image/png" }));
  await store.setImage("answer-image:private", new Blob(["private answer"], { type: "image/png" }));

  const response = await createUserPapersHandler(store)(new Request("https://example.test/api/user-papers?image=paper-1"));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.equal(await response.text(), "question image");
});
