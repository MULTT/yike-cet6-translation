import assert from "node:assert/strict";
import test from "node:test";

import {
  listPublishedPassages,
  queueCandidate,
  reviewCandidate,
} from "./review-service.mjs";

function createStore() {
  const records = new Map();

  return {
    async get(key) {
      return records.get(key) ?? null;
    },
    async set(key, value) {
      records.set(key, structuredClone(value));
    },
    async list() {
      return [...records.values()].map((value) => structuredClone(value));
    },
  };
}

function passage(id, overrides = {}) {
  return {
    id,
    kind: "past-paper",
    exam: {
      year: 2025,
      month: 6,
      paper: "第一套",
      sourceUrl: "https://example.test/cet6/2025-06-1",
    },
    sourceText: "第一句中文。第二句中文。",
    referenceText: "The first Chinese sentence. The second Chinese sentence.",
    sentences: [
      {
        order: 1,
        sourceText: "第一句中文。",
        referenceText: "The first Chinese sentence.",
      },
      {
        order: 2,
        sourceText: "第二句中文。",
        referenceText: "The second Chinese sentence.",
      },
    ],
    ...overrides,
  };
}

test("rejects a candidate with a duplicate source-aware fingerprint", async () => {
  const store = createStore();
  await queueCandidate(store, passage("candidate-1"));

  await assert.rejects(
    queueCandidate(store, passage("candidate-2")),
    /duplicate/i
  );
});

test("rejects an invalid passage before it enters the candidate queue", async () => {
  const store = createStore();
  const invalid = passage("candidate-1");
  delete invalid.exam.sourceUrl;

  await assert.rejects(queueCandidate(store, invalid), /invalid passage/i);
  assert.deepEqual(await store.list(), []);
});

test("rejects publishing without a reviewer identity or valid decision", async () => {
  const store = createStore();
  await queueCandidate(store, passage("candidate-1", { sourceVerified: true }));

  await assert.rejects(
    reviewCandidate(store, "candidate-1", "publish", " "),
    /reviewer/i
  );
  await assert.rejects(
    reviewCandidate(store, "candidate-1", "archive", "editor"),
    /decision/i
  );
});

test("rejects review of a candidate that is no longer pending", async () => {
  const store = createStore();
  await queueCandidate(store, passage("candidate-1", { sourceVerified: true }));
  await reviewCandidate(store, "candidate-1", "publish", "editor");

  await assert.rejects(
    reviewCandidate(store, "candidate-1", "reject", "editor"),
    /pending/i
  );
});

test("publishes only a verified pending candidate and preserves its audit trail", async () => {
  const store = createStore();
  const queued = await queueCandidate(
    store,
    passage("candidate-1", { sourceVerified: true })
  );

  const result = await reviewCandidate(store, "candidate-1", "publish", "editor");

  assert.equal(queued.status, "pending");
  assert.equal(result.status, "published");
  assert.equal(result.reviewer, "editor");
  assert.equal(result.decision, "publish");
  assert.equal(result.createdAt, queued.createdAt);
  assert.ok(result.reviewedAt);
  assert.ok(result.publishedAt);
});

test("does not publish an unverified candidate", async () => {
  const store = createStore();
  await queueCandidate(store, passage("candidate-1"));

  await assert.rejects(
    reviewCandidate(store, "candidate-1", "publish", "editor"),
    /verified/i
  );
});

test("lists only published passages", async () => {
  const store = createStore();
  await queueCandidate(store, passage("published", { sourceVerified: true }));
  await queueCandidate(store, passage("pending", {
    exam: {
      year: 2025,
      month: 12,
      paper: "第二套",
      sourceUrl: "https://example.test/cet6/2025-12-2",
    },
  }));
  await queueCandidate(store, passage("rejected", {
    exam: {
      year: 2024,
      month: 12,
      paper: "第一套",
      sourceUrl: "https://example.test/cet6/2024-12-1",
    },
    sourceVerified: true,
  }));
  await reviewCandidate(store, "published", "publish", "editor");
  await reviewCandidate(store, "rejected", "reject", "editor");

  const published = await listPublishedPassages(store);

  assert.deepEqual(published.map((record) => record.id), ["published"]);
  assert.equal(published[0].status, "published");
});
