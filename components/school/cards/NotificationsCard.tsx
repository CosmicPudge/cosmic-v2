"use client";

import {
  AlertCircle,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Megaphone,
} from "lucide-react";

import SchoolCard from "../ui/SchoolCard";
import SchoolBadge from "../ui/SchoolBadge";

import type { SchoolNotification } from "../data/intelligence/notifications";

interface NotificationsCardProps {
  notifications: SchoolNotification[];
}

function getNotificationIcon(type: SchoolNotification["type"]) {
  switch (type) {
    case "assignment":
      return ClipboardList;

    case "exam":
      return BookOpen;

    case "quiz":
      return BookOpen;

    case "class":
      return CalendarDays;

    case "announcement":
      return Megaphone;

    default:
      return Bell;
  }
}

function getPriorityStyles(priority: SchoolNotification["priority"]) {
  switch (priority) {
    case "critical":
      return {
        border: "bg-red-500",
        icon: "text-red-400",
        badge: "red" as const,
      };

    case "high":
      return {
        border: "bg-orange-500",
        icon: "text-orange-400",
        badge: "orange" as const,
      };

    case "medium":
      return {
        border: "bg-sky-500",
        icon: "text-sky-400",
        badge: "blue" as const,
      };

    default:
      return {
        border: "bg-emerald-500",
        icon: "text-emerald-400",
        badge: "green" as const,
      };
  }
}

export default function NotificationsCard({
  notifications,
}: NotificationsCardProps) {
  return (
    <SchoolCard
      title="Notifications"
      subtitle="Things that need your attention"
      accent="orange"
    >
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-10 text-center">
          <div className="mb-4 rounded-full border border-emerald-500/30 bg-emerald-500/10 p-4">
            <Bell className="h-7 w-7 text-emerald-400" />
          </div>

          <h3 className="text-lg font-semibold text-white">
            You're all caught up
          </h3>

          <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/60">
            No important notifications right now. Nice work staying on top of
            your classes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);

            const styles = getPriorityStyles(notification.priority);

            return (
              <div
                key={notification.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
              >
                {/* Priority Accent */}
                <div
                  className={`absolute inset-y-0 left-0 w-1 ${styles.border}`}
                />

                <div className="flex items-start gap-4 p-4 pl-5">
                  <div
                    className={`rounded-xl border border-white/10 bg-white/5 p-2 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className={`h-5 w-5 ${styles.icon}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold tracking-tight text-white">
                        {notification.title}
                      </h3>

                      <SchoolBadge color={styles.badge}>
                        {notification.priority.toUpperCase()}
                      </SchoolBadge>
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-white/65">
                      {notification.description}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-xs uppercase tracking-wider text-white/35">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {notification.type.replace("-", " ")}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SchoolCard>
  );
}