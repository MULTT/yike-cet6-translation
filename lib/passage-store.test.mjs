import assert from "node:assert/strict";
import test from "node:test";

import {
  createFingerprint,
  splitPassageForReview,
  validatePassage,
} from "./passage-store.mjs";

const passage = () => ({
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
});

test("rejects a past paper without a source URL", () => {
  const record = passage();
  delete record.exam.sourceUrl;

  assert.equal(validatePassage(record).ok, false);
});

test("rejects source sentences that are out of order", () => {
  const record = passage();
  record.sentences[1].order = 3;

  assert.equal(validatePassage(record).ok, false);
});

test("rejects a passage with empty source text", () => {
  const record = passage();
  record.sentences[1].sourceText = "   ";

  assert.equal(validatePassage(record).ok, false);
});

test("creates a stable fingerprint that includes the source URL", () => {
  const record = passage();
  const duplicate = structuredClone(record);
  const anotherSource = structuredClone(record);
  anotherSource.exam.sourceUrl = "https://example.test/other-source";

  assert.equal(createFingerprint(record), createFingerprint(duplicate));
  assert.notEqual(createFingerprint(record), createFingerprint(anotherSource));
});

test("splits a complete English answer into source sentence order", () => {
  const result = splitPassageForReview(
    passage(),
    "The first Chinese sentence. The second Chinese sentence!"
  );

  assert.equal(result.alignment, "exact");
  assert.deepEqual(result.answers, [
    "The first Chinese sentence.",
    "The second Chinese sentence!",
  ]);
});

test("keeps the complete answer when sentence counts cannot align", () => {
  const answer = "A single English sentence without a matching second sentence.";
  const result = splitPassageForReview(passage(), answer);

  assert.equal(result.alignment, "approximate");
  assert.equal(result.answer, answer);
  assert.deepEqual(result.answers, [answer]);
});
