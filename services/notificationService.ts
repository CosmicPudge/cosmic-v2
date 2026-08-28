import type { CosmicNotification, CosmicNotificationImportance, CosmicNotificationSnapshot } from "@/core/contracts/Notifications";
import { createScopedStorageKey, migrateLegacyStorage, readScopedOrLegacy } from "@/services/storage/scope";
export { markAllNotificationsRead, markNotificationRead, mergeNotifications, notificationChanged, removeExpiredNotifications, removeNotification, sortNotifications, upsertNotification } from "@/services/notificationModel";

export const NOTIFICATIONS_STORAGE_KEY = "cosmic.notifications";
export const NOTIFICATIONS_UPDATE_EVENT = "cosmic:notifications-updated";
export const emptyNotificationSnapshot: CosmicNotificationSnapshot = { version: 1, notifications: [] };

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isImportance(value: unknown): value is CosmicNotificationImportance { return value === "urgent" || value === "important" || value === "normal"; }
function isNotification(value: unknown): value is CosmicNotification {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && typeof value.source === "string" && typeof value.title === "string" && typeof value.timestamp === "string" && typeof value.read === "boolean" && isImportance(value.importance);
}

export function readNotificationSnapshot(scopeId?: string): CosmicNotificationSnapshot {
  try {
    const stored = readScopedOrLegacy("notifications", scopeId, NOTIFICATIONS_STORAGE_KEY);
    if (stored.migrated && stored.raw) migrateLegacyStorage("notifications", stored.raw, scopeId);
    const parsed: unknown = stored.raw ? JSON.parse(stored.raw) : undefined;
    if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.notifications)) return emptyNotificationSnapshot;
    return { version: 1, notifications: parsed.notifications.filter(isNotification) };
  } catch { return emptyNotificationSnapshot; }
}

export function replaceNotificationSnapshot(snapshot: CosmicNotificationSnapshot, scopeId?: string) {
  if (snapshot.version !== 1 || !snapshot.notifications.every(isNotification)) throw new Error("Invalid notification snapshot.");
  localStorage.setItem(createScopedStorageKey("notifications", scopeId), JSON.stringify(snapshot));
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATE_EVENT, { detail: { scopeId, snapshot } }));
}
