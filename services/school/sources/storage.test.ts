import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner does not resolve extensionless imports.
import { getSchoolAssetStore, LocalSchoolAssetStore, UnconfiguredSchoolAssetStore } from "./storage.ts";

test("uses local storage outside production", () => {
  const previous = process.env.NODE_ENV;
  const env = process.env as Record<string, string | undefined>; env.NODE_ENV = "test";
  assert.ok(getSchoolAssetStore() instanceof LocalSchoolAssetStore);
  if (previous) env.NODE_ENV = previous; else delete env.NODE_ENV;
});

test("fails closed for production without Blob credentials", () => {
  const previousNode = process.env.NODE_ENV; const previousToken = process.env.BLOB_READ_WRITE_TOKEN;
  const env = process.env as Record<string, string | undefined>; env.NODE_ENV = "production"; delete env.BLOB_READ_WRITE_TOKEN;
  assert.ok(getSchoolAssetStore() instanceof UnconfiguredSchoolAssetStore);
  if (previousNode) env.NODE_ENV = previousNode; else delete env.NODE_ENV;
  if (previousToken) env.BLOB_READ_WRITE_TOKEN = previousToken;
});
