import {
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  Flag,
  GraduationCap,
  MapPinned,
  Plane,
  Timer,
  User,
} from "lucide-react";

import {
  TimelineData,
  TimelineEvent,
  TimelineEventType,
  TimelineState,
  TimelineStatus,
} from "./timelineTypes";

export interface TimelineAppearance {
  icon: any;
  accentClass: string;
  borderClass: string;
  glowClass: string;
  iconClass: string;
}

const EVENT_APPEARANCE: Record<
  TimelineEventType,
  TimelineAppearance
> = {
  class: {
    icon: GraduationCap,
    accentClass: "bg-sky-500",
    borderClass: "border-sky-500/25",
    glowClass: "from-sky-500/15 via-transparent to-transparent",
    iconClass: "text-sky-300",
  },

  assignment: {
    icon: ClipboardCheck,
    accentClass: "bg-violet-500",
    borderClass: "border-violet-500/25",
    glowClass: "from-violet-500/15 via-transparent to-transparent",
    iconClass: "text-violet-300",
  },

  exam: {
    icon: Flag,
    accentClass: "bg-red-500",
    borderClass: "border-red-500/25",
    glowClass: "from-red-500/15 via-transparent to-transparent",
    iconClass: "text-red-300",
  },

  quiz: {
    icon: BookOpen,
    accentClass: "bg-orange-500",
    borderClass: "border-orange-500/25",
    glowClass: "from-orange-500/15 via-transparent to-transparent",
    iconClass: "text-orange-300",
  },

  study: {
    icon: BookOpen,
    accentClass: "bg-emerald-500",
    borderClass: "border-emerald-500/25",
    glowClass: "from-emerald-500/15 via-transparent to-transparent",
    iconClass: "text-emerald-300",
  },

  meeting: {
    icon: User,
    accentClass: "bg-indigo-500",
    borderClass: "border-indigo-500/25",
    glowClass: "from-indigo-500/15 via-transparent to-transparent",
    iconClass: "text-indigo-300",
  },

  afrotc: {
    icon: Flag,
    accentClass: "bg-cyan-500",
    borderClass: "border-cyan-500/25",
    glowClass: "from-cyan-500/15 via-transparent to-transparent",
    iconClass: "text-cyan-300",
  },

  deadline: {
    icon: CalendarClock,
    accentClass: "bg-amber-500",
    borderClass: "border-amber-500/25",
    glowClass: "from-amber-500/15 via-transparent to-transparent",
    iconClass: "text-amber-300",
  },

  personal: {
    icon: User,
    accentClass: "bg-pink-500",
    borderClass: "border-pink-500/25",
    glowClass: "from-pink-500/15 via-transparent to-transparent",
    iconClass: "text-pink-300",
  },

  travel: {
    icon: Plane,
    accentClass: "bg-blue-500",
    borderClass: "border-blue-500/25",
    glowClass: "from-blue-500/15 via-transparent to-transparent",
    iconClass: "text-blue-300",
  },
};

export function getTimelineAppearance(
  type: TimelineEventType
): TimelineAppearance {
  return EVENT_APPEARANCE[type];
}

function toMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);

  return hour * 60 + minute;
}

export function sortTimelineEvents(
  events: TimelineEvent[]
): TimelineEvent[] {
  return [...events].sort(
    (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)
  );
}

export function resolveStatus(
  event: TimelineEvent,
  currentMinutes: number
): TimelineStatus {
  if (event.status === "cancelled") {
    return "cancelled";
  }

  if (event.status === "missed") {
    return "missed";
  }

  const start = toMinutes(event.startTime);
  const end = event.endTime
    ? toMinutes(event.endTime)
    : start;

  if (currentMinutes < start) {
    return "upcoming";
  }

  if (currentMinutes >= start && currentMinutes <= end) {
    return "current";
  }

  return "completed";
}

export function buildTimeline(
  data: TimelineData
): TimelineState {
  const currentMinutes = toMinutes(data.currentTime);

  const events = sortTimelineEvents(data.events).map((event) => ({
    ...event,
    status: resolveStatus(event, currentMinutes),
  }));

  const currentEvent = events.find(
    (event) => event.status === "current"
  );

  const nextEvent = events.find(
    (event) => event.status === "upcoming"
  );

  const completedCount = events.filter(
    (event) => event.status === "completed"
  ).length;

  const remainingCount = events.filter(
    (event) =>
      event.status === "current" ||
      event.status === "upcoming"
  ).length;

  const scheduledMinutes = events.reduce(
    (total, event) =>
      total + (event.durationMinutes ?? 0),
    0
  );

  const completedMinutes = events
    .filter((event) => event.status === "completed")
    .reduce(
      (total, event) =>
        total + (event.durationMinutes ?? 0),
      0
    );

  const progress =
    scheduledMinutes === 0
      ? 0
      : Math.round(
          (completedMinutes / scheduledMinutes) * 100
        );

  return {
    events,
    currentEvent,
    nextEvent,
    completedCount,
    remainingCount,
    scheduledMinutes,
    completedMinutes,
    progress,
  };
}

export function formatDuration(
  minutes: number
): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (remaining === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remaining} min`;
}

export function getStatusLabel(
  status: TimelineStatus
): string {
  switch (status) {
    case "completed":
      return "Completed";

    case "current":
      return "Now";

    case "upcoming":
      return "Upcoming";

    case "missed":
      return "Missed";

    case "cancelled":
      return "Cancelled";

    default:
      return status;
  }
}