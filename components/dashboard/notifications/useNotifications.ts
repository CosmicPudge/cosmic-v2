"use client";

import { useDashboard } from "../state/useDashboard";

export function useNotifications() {
  const {
    notifications,
    pushNotification,
    clearNotifications,
  } = useDashboard();

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  return {
    notifications,
    unreadCount,
    pushNotification,
    clearNotifications,
  };
}