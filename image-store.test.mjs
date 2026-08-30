import test from "node:test";
import assert from "node:assert/strict";
import { validateImageFile } from "./image-store.mjs";

test("image upload rejects a non-image file and an oversized photo", () => {
  assert.equal(validateImageFile({ type: "text/plain", size: 10 }).ok, false);
  assert.equal(validateImageFile({ type: "image/jpeg", size: 8 * 1024 * 1024 + 1 }).ok, false);
  assert.equal(validateImageFile({ type: "image/png", size: 200 }).ok, true);
});
