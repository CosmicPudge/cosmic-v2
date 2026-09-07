import assert from "node:assert/strict";
import test from "node:test";

import { selectCosmicApiBase } from "../src/glasses/data/apiBase.ts";

test("defaults to same-origin glasses APIs for production-safe deployment", () => {
  assert.equal(selectCosmicApiBase(undefined), "/api/glasses");
  assert.equal(selectCosmicApiBase(""), "/api/glasses");
  assert.equal(selectCosmicApiBase("   "), "/api/glasses");
});

test("allows an explicit environment-configured API origin", () => {
  assert.equal(
    selectCosmicApiBase("https://api.example.test/api/glasses"),
    "https://api.example.test/api/glasses",
  );
});

test("does not put a development localhost fallback in the production selector", () => {
  assert.equal(selectCosmicApiBase(undefined).includes("localhost"), false);
  assert.equal(selectCosmicApiBase(undefined).includes("127.0.0.1"), false);
});
