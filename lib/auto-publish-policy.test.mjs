import assert from "node:assert/strict";
import test from "node:test";
import { canAutoPublish } from "./auto-publish-policy.mjs";

const record = { kind: "past-paper", exam: { year: 2013, month: 12, paper: "文都版", sourceUrl: "https://www.wendu.com/paper.pdf" }, sourceText: "第一句。第二句。", referenceText: "First sentence. Second sentence.", sentences: [{ order: 1, sourceText: "第一句。", referenceText: "First sentence." }, { order: 2, sourceText: "第二句。", referenceText: "Second sentence." }] };

test("auto-publishes only complete records from an allowlisted source", () => {
  assert.equal(canAutoPublish(record), true);
  assert.equal(canAutoPublish({ ...record, exam: { ...record.exam, sourceUrl: "https://unknown.example/paper" } }), false);
  assert.equal(canAutoPublish({ ...record, exam: { ...record.exam, year: undefined } }), false);
});
