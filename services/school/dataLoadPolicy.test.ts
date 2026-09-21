import assert from "node:assert/strict";
import test from "node:test";

import { shouldLoadAccountBackedSchoolData } from "./dataLoadPolicy";

test("only account scope loads account-backed School data", () => {
  for (const scopeKind of ["personal", "local", "device", "dev", "unknown"]) {
    assert.equal(shouldLoadAccountBackedSchoolData(scopeKind), false, scopeKind);
  }
  assert.equal(shouldLoadAccountBackedSchoolData("account"), true);
});
