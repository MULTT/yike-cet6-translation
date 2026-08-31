import assert from "node:assert/strict";
import test from "node:test";

import {
  createUserPaper,
  listUserPapers,
  saveUserPaper,
  validateUserPaper,
} from "./user-paper-store.mjs";

function createStore() {
  const records = new Map();
  const prefixes = [];

  return {
    prefixes,
    async set(key, value) {
      records.set(key, structuredClone(value));
    },
    async list(prefix = "") {
      prefixes.push(prefix);
      return [...records.entries()]
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, value]) => ({ key, value: structuredClone(value) }));
    },
  };
}

test("accepts a four-digit year, an exam month, and an image key", () => {
  assert.equal(validateUserPaper({ year: 2025, month: 6, imageKey: "image-1" }).ok, true);
});

test("rejects a user paper with an invalid exam month", () => {
  assert.equal(validateUserPaper({ year: 2025, month: 13, imageKey: "image-1" }).ok, false);
});

test("rejects a user paper without a four-digit year or image key", () => {
  assert.equal(validateUserPaper({ year: 999, month: 6, imageKey: "image-1" }).ok, false);
  assert.equal(validateUserPaper({ year: 2025, month: 12, imageKey: "   " }).ok, false);
});

test("creates an upload record that is ready without claiming verification", () => {
  const paper = createUserPaper({
    year: 2025,
    month: 12,
    imageKey: "user-paper-image:image-1",
    ocrText: "  已校对的 OCR 文字。  ",
  });

  assert.match(paper.id, /^[\da-f-]{36}$/i);
  assert.equal(paper.kind, "user-upload");
  assert.equal(paper.status, "ready");
  assert.equal(paper.year, 2025);
  assert.equal(paper.month, 12);
  assert.equal(paper.imageKey, "user-paper-image:image-1");
  assert.equal(paper.ocrText, "已校对的 OCR 文字。");
  assert.equal("sourceVerified" in paper, false);
  assert.equal("verified" in paper, false);
  assert.ok(Number.isFinite(Date.parse(paper.createdAt)));
});

test("rejects creation from invalid upload metadata", () => {
  assert.throws(
    () => createUserPaper({ year: 2025, month: 7, imageKey: "image-1" }),
    /invalid user paper/i
  );
});

test("saves a valid upload under its isolated key", async () => {
  const store = createStore();
  const paper = createUserPaper({ year: 2024, month: 6, imageKey: "user-paper-image:image-2" });

  const saved = await saveUserPaper(store, paper);

  assert.deepEqual(saved, paper);
  assert.deepEqual(await store.list(`user-paper:${paper.id}`), [{
    key: `user-paper:${paper.id}`,
    value: paper,
  }]);
});

test("rejects direct saves that carry a verification field", async () => {
  const store = createStore();
  const paper = createUserPaper({ year: 2024, month: 12, imageKey: "user-paper-image:image-3" });

  await assert.rejects(
    saveUserPaper(store, { ...paper, verified: false }),
    /verification/i
  );
  await assert.rejects(
    saveUserPaper(store, { ...paper, sourceVerified: false }),
    /verification/i
  );
  assert.deepEqual(await store.list("user-paper:"), []);
});

test("lists only user-upload records from the user-paper namespace", async () => {
  const store = createStore();
  const june = createUserPaper({ year: 2024, month: 6, imageKey: "user-paper-image:june" });
  const december = createUserPaper({ year: 2025, month: 12, imageKey: "user-paper-image:december" });
  await saveUserPaper(store, june);
  await saveUserPaper(store, december);
  await store.set("review-candidate:verified", { id: "verified", kind: "past-paper" });

  const papers = await listUserPapers(store);

  assert.deepEqual(papers.map((paper) => paper.id), [june.id, december.id]);
  assert.deepEqual(store.prefixes.slice(-1), ["user-paper:"]);
});
