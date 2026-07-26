"use client";

import type { DashboardNotification } from "../state/DashboardTypes";

interface NotificationCardProps {
  notification: DashboardNotification;
}

export default function NotificationCard({
  notification,
}: NotificationCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="font-medium">
        {notification.title}
      </div>

      {notification.description && (
        <p className="mt-1 text-sm text-zinc-400">
          {notification.description}
        </p>
      )}

      <div className="mt-3 text-xs text-zinc-500">
        {new Date(
          notification.createdAt
        ).toLocaleString()}
      </div>
    </div>
  );
}