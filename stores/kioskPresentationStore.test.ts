import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types test runner resolves the explicit TypeScript extension.
import { useKioskPresentationStore } from "./kioskPresentationStore.ts";

test("manual and idle entry share the mounted desktop presentation state", () => {
  const store = useKioskPresentationStore;
  store.getState().exit();

  store.getState().enterManual();
  assert.deepEqual({ active: store.getState().active, entry: store.getState().entry }, { active: true, entry: "manual" });

  store.getState().enterIdle();
  assert.deepEqual({ active: store.getState().active, entry: store.getState().entry }, { active: true, entry: "idle" });

  store.getState().exit();
  assert.deepEqual({ active: store.getState().active, entry: store.getState().entry }, { active: false, entry: null });
});
