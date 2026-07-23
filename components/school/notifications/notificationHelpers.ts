import {
  AlertTriangle,
  Bell,
  Brain,
  CalendarClock,
  CheckCircle2,
  Info,
  LucideIcon,
} from "lucide-react";

import {
  NotificationPriority,
  NotificationSource,
  NotificationType,
} from "./notificationTypes";

export interface NotificationAppearance {
  icon: LucideIcon;

  iconClass: string;

  accentClass: string;

  borderClass: string;

  badgeClass: string;

  glowClass: string;
}

const TYPE_APPEARANCE: Record<
  NotificationType,
  NotificationAppearance
> = {
  critical: {
    icon: AlertTriangle,
    iconClass: "text-red-300",
    accentClass: "bg-red-400",
    borderClass: "border-red-500/30",
    badgeClass:
      "bg-red-500/10 text-red-300 border-red-500/20",
    glowClass: "from-red-500/20 to-transparent",
  },

  warning: {
    icon: AlertTriangle,
    iconClass: "text-orange-300",
    accentClass: "bg-orange-400",
    borderClass: "border-orange-500/30",
    badgeClass:
      "bg-orange-500/10 text-orange-300 border-orange-500/20",
    glowClass: "from-orange-500/20 to-transparent",
  },

  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-300",
    accentClass: "bg-emerald-400",
    borderClass: "border-emerald-500/30",
    badgeClass:
      "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    glowClass: "from-emerald-500/20 to-transparent",
  },

  info: {
    icon: Info,
    iconClass: "text-sky-300",
    accentClass: "bg-sky-400",
    borderClass: "border-sky-500/30",
    badgeClass:
      "bg-sky-500/10 text-sky-300 border-sky-500/20",
    glowClass: "from-sky-500/20 to-transparent",
  },

  reminder: {
    icon: CalendarClock,
    iconClass: "text-violet-300",
    accentClass: "bg-violet-400",
    borderClass: "border-violet-500/30",
    badgeClass:
      "bg-violet-500/10 text-violet-300 border-violet-500/20",
    glowClass: "from-violet-500/20 to-transparent",
  },

  insight: {
    icon: Brain,
    iconClass: "text-cyan-300",
    accentClass: "bg-cyan-400",
    borderClass: "border-cyan-500/30",
    badgeClass:
      "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    glowClass: "from-cyan-500/20 to-transparent",
  },
};

export function getNotificationAppearance(
  type: NotificationType
): NotificationAppearance {
  return TYPE_APPEARANCE[type];
}

export function getPriorityWeight(
  priority: NotificationPriority
): number {
  switch (priority) {
    case "urgent":
      return 4;

    case "high":
      return 3;

    case "medium":
      return 2;

    case "low":
    default:
      return 1;
  }
}

export function getSourceLabel(
  source: NotificationSource
): string {
  switch (source) {
    case "canvas":
      return "Canvas";

    case "calendar":
      return "Calendar";

    case "cosmic":
      return "Cosmic AI";

    case "system":
      return "System";

    case "manual":
      return "Manual";

    default:
      return "";
  }
}

export function sortNotifications<T extends {
  priority: NotificationPriority;
}>(
  notifications: T[]
): T[] {
  return [...notifications].sort(
    (a, b) =>
      getPriorityWeight(b.priority) -
      getPriorityWeight(a.priority)
  );
}

export function formatRelativeTime(
  timestamp: string
): string {
  return timestamp;
}

export function getStatusText(
  notificationCount: number
): string {
  if (notificationCount === 0) {
    return "All Caught Up";
  }

  if (notificationCount <= 3) {
    return "Everything Under Control";
  }

  if (notificationCount <= 6) {
    return "Attention Needed";
  }

  return "High Activity";
}