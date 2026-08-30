import assert from "node:assert/strict";
import test from "node:test";

import { isAdminUser } from "./admin-auth.mjs";

test("recognizes only the admin role", () => {
  assert.equal(isAdminUser(null), false);
  assert.equal(isAdminUser({}), false);
  assert.equal(isAdminUser({ roles: ["member"] }), false);
  assert.equal(isAdminUser({ roles: ["admin"] }), true);
});
