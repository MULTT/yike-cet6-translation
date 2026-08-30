import test from "node:test";
import assert from "node:assert/strict";
import {
  createEmptyState,
  canSubmitAttempt,
  getExtraPractice,
  isVerifiedPastPaper,
  gradeSentence,
  getTrainingSetForDate,
  recordSubmission,
  trainingSets,
} from "./core.mjs";

test("daily training contains two consecutive sentences", () => {
  assert.ok(trainingSets.length >= 5);
  for (const set of trainingSets) {
    assert.equal(set.sentences.length, 2);
    assert.equal(set.sentences[1].order, set.sentences[0].order + 1);
    assert.ok(set.sentences.every((sentence) => sentence.reference.length > 0));
  }
});

test("grading accepts alternatives and identifies missed criteria", () => {
  const sentence = {
    rubric: [
      { id: "role", category: "词汇", alternatives: ["plays an important role", "is important"] },
      { id: "festival", category: "搭配", alternatives: ["during festivals"] },
    ],
  };
  const result = gradeSentence(sentence, "Paper cutting plays an important role in many festivals.");
  assert.equal(result.coverage, 50);
  assert.deepEqual(result.matched.map((item) => item.id), ["role"]);
  assert.deepEqual(result.missed.map((item) => item.id), ["festival"]);
});

test("a training set is deterministically selected for a calendar date", () => {
  assert.equal(getTrainingSetForDate(new Date("2026-08-30")).id, getTrainingSetForDate(new Date("2026-08-30")).id);
});

test("the same training submission only records missed items once", () => {
  const submission = {
    setId: "folk-art",
    date: "2026-08-30",
    answers: ["A", "B"],
    results: [{ missed: [{ id: "festival", category: "搭配", label: "during festivals", advice: "Use during festivals." }] }],
  };
  const once = recordSubmission(createEmptyState(), submission);
  const twice = recordSubmission(once, submission);
  assert.equal(once.mistakes.length, 1);
  assert.deepEqual(twice.mistakes, once.mistakes);
});

test("verified past papers retain year, paper and source metadata", () => {
  const papers = trainingSets.filter((set) => set.kind === "past-paper");
  assert.ok(papers.length > 0);
  assert.ok(papers.every(isVerifiedPastPaper));
});

test("extra practice prefers unfinished past papers", () => {
  assert.equal(getExtraPractice(createEmptyState(), 1)[0].kind, "past-paper");
});

test("a photo never replaces the two typed answers required for grading", () => {
  assert.equal(canSubmitAttempt(["Answer one.", ""], "photo-1"), false);
  assert.equal(canSubmitAttempt(["Answer one.", "Answer two."], "photo-1"), true);
});
