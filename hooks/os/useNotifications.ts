"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CosmicNotification } from "@/core/contracts/Notifications";
import useCalendar from "@/hooks/os/useCalendar";
import { useSports } from "@/hooks/os/useSports";
import { useCosmicScope } from "@/services/storage/scope";
import { markAllNotificationsRead, markNotificationRead, mergeNotifications, notificationChanged, NOTIFICATIONS_UPDATE_EVENT, readNotificationSnapshot, replaceNotificationSnapshot, sortNotifications } from "@/services/notificationService";

function formatCalendarBody(start: Date, location?: string) {
  const time = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return location ? `${time} · ${location}` : time;
}

function buildSourceNotifications(calendar: ReturnType<typeof useCalendar>["calendar"], sports: ReturnType<typeof useSports>["data"]): CosmicNotification[] {
  const calendarNotifications = (calendar?.upcoming ?? []).slice(0, 3).map((event) => ({ id: `calendar:${event.id}:upcoming`, source: "calendar" as const, title: event.title, body: formatCalendarBody(event.start, event.location), timestamp: event.start.toISOString(), read: false, importance: event.priority === "high" ? "important" as const : "normal" as const, ...(event.category ? { category: event.category } : {}), icon: "calendar" }));
  const sportsNotifications = (sports?.live ?? []).slice(0, 3).map((event) => ({ id: `sports:${event.id}:live`, source: "sports" as const, title: event.title, body: event.statusDetail ?? "Live now", timestamp: event.start.toISOString(), read: false, importance: "normal" as const, category: event.sport, icon: "sports" }));
  return [...calendarNotifications, ...sportsNotifications];
}

export function useNotifications() {
  const scope = useCosmicScope();
  const { calendar } = useCalendar();
  const { data: sports } = useSports();
  const [stored, setStored] = useState<CosmicNotification[]>([]);
  const [ready, setReady] = useState(false);
  const incoming = useMemo(() => buildSourceNotifications(calendar, sports), [calendar, sports]);
  const merged = useMemo(() => mergeNotifications(stored, incoming), [stored, incoming]);
  useEffect(() => {
    const timer = window.setTimeout(() => { setStored(readNotificationSnapshot(scope.id).notifications); setReady(true); }, 0);
    return () => window.clearTimeout(timer);
  }, [scope.id]);
  useEffect(() => {
    if (!ready) return;
    const next = mergeNotifications(stored, incoming);
    if (notificationChanged(stored, next)) replaceNotificationSnapshot({ version: 1, notifications: next }, scope.id);
  }, [incoming, ready, scope.id, stored]);
  useEffect(() => {
    const sync = (event: Event) => {
      const detail = event instanceof CustomEvent ? event.detail as { scopeId?: string } : undefined;
      if (detail?.scopeId && detail.scopeId !== scope.id) return;
      setStored(readNotificationSnapshot(scope.id).notifications);
    };
    window.addEventListener("storage", sync);
    window.addEventListener(NOTIFICATIONS_UPDATE_EVENT, sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener(NOTIFICATIONS_UPDATE_EVENT, sync); };
  }, [scope.id]);
  const markRead = useCallback((id: string) => setStored((current) => { const next = markNotificationRead(current, id); replaceNotificationSnapshot({ version: 1, notifications: next }, scope.id); return next; }), [scope.id]);
  const markAllRead = useCallback(() => setStored((current) => { const next = markAllNotificationsRead(current); replaceNotificationSnapshot({ version: 1, notifications: next }, scope.id); return next; }), [scope.id]);
  const notifications = useMemo(() => sortNotifications(merged), [merged]);
  return { notifications, unreadCount: notifications.filter((item) => !item.read).length, loading: !ready, markRead, markAllRead };
}
