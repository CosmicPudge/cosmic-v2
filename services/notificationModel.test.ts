import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript runner resolves the explicit extension.
import { markAllNotificationsRead, markNotificationRead, mergeNotifications, removeExpiredNotifications, sortNotifications, upsertNotification } from "./notificationModel.ts";
import type { CosmicNotification } from "@/core/contracts/Notifications";

const notification = (id: string, overrides: Partial<CosmicNotification> = {}): CosmicNotification => ({ id, source: "system", title: id, timestamp: "2026-08-28T12:00:00.000Z", read: false, importance: "normal", ...overrides });

test("deduplicates by stable id while preserving read state", () => {
  const result = upsertNotification([notification("a", { read: true })], notification("a", { title: "updated" }));
  assert.equal(result.length, 1);
  assert.equal(result[0].read, true);
  assert.equal(result[0].title, "updated");
});

test("sorts unread importance before recent read notifications", () => {
  const result = sortNotifications([
    notification("read", { read: true, timestamp: "2026-08-28T13:00:00.000Z" }),
    notification("normal", { timestamp: "2026-08-28T14:00:00.000Z" }),
    notification("urgent", { importance: "urgent", timestamp: "2026-08-28T12:00:00.000Z" }),
  ], Date.parse("2026-08-28T15:00:00.000Z"));
  assert.deepEqual(result.map((item) => item.id), ["urgent", "normal", "read"]);
});

test("removes expired records and merges incoming records without duplicates", () => {
  const existing = [notification("old", { expiresAt: "2026-08-27T00:00:00.000Z" })];
  const merged = mergeNotifications(existing, [notification("new")]);
  assert.equal(merged.length, 2);
  assert.equal(removeExpiredNotifications(merged, Date.parse("2026-08-28T00:00:00.000Z")).length, 1);
});

test("supports one and all read transitions", () => {
  const records = [notification("one"), notification("two")];
  assert.equal(markNotificationRead(records, "one")[0].read, true);
  assert.deepEqual(markAllNotificationsRead(records).map((item) => item.read), [true, true]);
});
