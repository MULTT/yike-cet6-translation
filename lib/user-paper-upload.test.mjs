import assert from "node:assert/strict";
import test from "node:test";
import { buildUserPaperFormData, formatOcrProgress, validateUserPaperUpload } from "./user-paper-upload.mjs";

test("validateUserPaperUpload only requires a valid year, month, and image", () => {
  assert.deepEqual(validateUserPaperUpload({ year: "2025", month: "6", image: { type: "image/jpeg" } }), { ok: true });
  assert.equal(validateUserPaperUpload({ year: "", month: "6", image: { type: "image/jpeg" } }).ok, false);
  assert.equal(validateUserPaperUpload({ year: "2025", month: "3", image: { type: "image/jpeg" } }).ok, false);
  assert.equal(validateUserPaperUpload({ year: "2025", month: "12", image: null }).ok, false);
});

test("buildUserPaperFormData keeps OCR text optional and trims it before upload", () => {
  const image = new Blob(["image"], { type: "image/png" });
  const payload = buildUserPaperFormData({ year: "2024", month: "12", image, ocrText: "  A translated passage.  " });

  assert.equal(payload.get("year"), "2024");
  assert.equal(payload.get("month"), "12");
  assert.equal(payload.get("ocrText"), "A translated passage.");
  assert.equal(payload.get("image").type, "image/png");
});

test("formatOcrProgress presents bounded whole-number progress to learners", () => {
  assert.equal(formatOcrProgress(-0.2), "0%");
  assert.equal(formatOcrProgress(0.376), "38%");
  assert.equal(formatOcrProgress(1.2), "100%");
});
