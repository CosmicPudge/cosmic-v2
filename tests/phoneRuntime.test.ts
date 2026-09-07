import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyBackendResults,
  shouldResumePhoneRefresh,
} from "../src/phone/phoneRuntime.ts";

test("classifies authenticated data access as connected", () => {
  assert.equal(classifyBackendResults([
    { status: "fulfilled", value: null },
    { status: "rejected", reason: new Error("Cosmic API returned 500") },
  ]), "connected");
});

test("classifies all authentication failures separately", () => {
  assert.equal(classifyBackendResults([
    { status: "rejected", reason: new Error("Cosmic API returned 401") },
    { status: "rejected", reason: new Error("Cosmic API returned 403") },
  ]), "unauthenticated");
});

test("classifies transport and server failures as unavailable", () => {
  assert.equal(classifyBackendResults([
    { status: "rejected", reason: new Error("Failed to fetch") },
  ]), "unavailable");
});

test("resumes only when visible and no refresh is in flight", () => {
  assert.equal(shouldResumePhoneRefresh("hidden", false), false);
  assert.equal(shouldResumePhoneRefresh("visible", true), false);
  assert.equal(shouldResumePhoneRefresh("visible", false), true);
});
