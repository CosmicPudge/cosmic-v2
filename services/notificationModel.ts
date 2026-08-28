import type { CosmicNotification, CosmicNotificationImportance } from "@/core/contracts/Notifications";

const IMPORTANCE_ORDER: Record<CosmicNotificationImportance, number> = { urgent: 0, important: 1, normal: 2 };

export function upsertNotification(notifications: CosmicNotification[], notification: CosmicNotification) {
  const index = notifications.findIndex((item) => item.id === notification.id);
  if (index < 0) return [...notifications, notification];
  return notifications.map((item, itemIndex) => itemIndex === index ? { ...notification, read: item.read } : item);
}

export function removeExpiredNotifications(notifications: CosmicNotification[], now = Date.now()) {
  return notifications.filter((item) => !item.expiresAt || Date.parse(item.expiresAt) > now);
}

export function removeNotification(notifications: CosmicNotification[], id: string) {
  return notifications.filter((item) => item.id !== id);
}

export function markNotificationRead(notifications: CosmicNotification[], id: string) {
  return notifications.map((item) => item.id === id ? { ...item, read: true } : item);
}

export function markAllNotificationsRead(notifications: CosmicNotification[]) {
  return notifications.map((item) => ({ ...item, read: true }));
}

export function sortNotifications(notifications: CosmicNotification[], now = Date.now()) {
  return [...removeExpiredNotifications(notifications, now)].sort((left, right) => {
    const unreadOrder = Number(left.read) - Number(right.read);
    if (unreadOrder !== 0) return unreadOrder;
    if (!left.read) {
      const importanceOrder = IMPORTANCE_ORDER[left.importance] - IMPORTANCE_ORDER[right.importance];
      if (importanceOrder !== 0) return importanceOrder;
    }
    return Date.parse(right.timestamp) - Date.parse(left.timestamp);
  });
}

export function mergeNotifications(existing: CosmicNotification[], incoming: CosmicNotification[]) {
  return incoming.reduce(upsertNotification, existing).filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index);
}

export function notificationChanged(left: CosmicNotification[], right: CosmicNotification[]) {
  return left.length !== right.length || left.some((item, index) => JSON.stringify(item) !== JSON.stringify(right[index]));
}
