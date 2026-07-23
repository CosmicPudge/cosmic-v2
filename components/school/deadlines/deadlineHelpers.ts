import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import {
  Deadline,
  DeadlinesData,
  DeadlinesState,
  DeadlinePriority,
  DeadlineStatus,
} from "./deadlineTypes";

export interface DeadlineAppearance {
  icon: any;
  colorClass: string;
  borderClass: string;
  backgroundClass: string;
  glowClass: string;
}

const PRIORITY_APPEARANCE: Record<
  DeadlinePriority,
  DeadlineAppearance
> = {
  critical: {
    icon: AlertTriangle,
    colorClass: "text-red-300",
    borderClass: "border-red-500/20",
    backgroundClass: "bg-red-500/10",
    glowClass: "from-red-500/20 via-red-400/10 to-transparent",
  },

  high: {
    icon: CalendarClock,
    colorClass: "text-orange-300",
    borderClass: "border-orange-500/20",
    backgroundClass: "bg-orange-500/10",
    glowClass: "from-orange-500/20 via-orange-400/10 to-transparent",
  },

  medium: {
    icon: CalendarDays,
    colorClass: "text-cyan-300",
    borderClass: "border-cyan-500/20",
    backgroundClass: "bg-cyan-500/10",
    glowClass: "from-cyan-500/20 via-cyan-400/10 to-transparent",
  },

  low: {
    icon: CheckCircle2,
    colorClass: "text-emerald-300",
    borderClass: "border-emerald-500/20",
    backgroundClass: "bg-emerald-500/10",
    glowClass: "from-emerald-500/20 via-emerald-400/10 to-transparent",
  },
};

export function getDeadlineAppearance(
  priority: DeadlinePriority
): DeadlineAppearance {
  return PRIORITY_APPEARANCE[priority];
}

export function buildDeadlines(
  data: DeadlinesData
): DeadlinesState {
  const priorityOrder: Record<
    DeadlinePriority,
    number
  > = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const deadlines = [...data.deadlines].sort((a, b) => {
    const priority =
      priorityOrder[a.priority] -
      priorityOrder[b.priority];

    if (priority !== 0) {
      return priority;
    }

    return (
      a.dueDate.getTime() -
      b.dueDate.getTime()
    );
  });

  const overdueDeadlines = deadlines.filter(
    (d) => d.status === "overdue"
  );

  const dueToday = deadlines.filter(
    (d) => d.status === "due-today"
  );

  const dueTomorrow = deadlines.filter(
    (d) => d.status === "upcoming"
  );

  const upcoming = deadlines.filter(
    (d) => d.status === "scheduled"
  );

  const completed = deadlines.filter(
    (d) => d.status === "completed"
  );

  const urgentDeadline =
    overdueDeadlines[0] ??
    dueToday[0] ??
    dueTomorrow[0] ??
    upcoming[0];

  const totalRemainingMinutes = deadlines
    .filter((d) => d.status !== "completed")
    .reduce(
      (sum, deadline) =>
        sum + (deadline.estimatedMinutes ?? 0),
      0
    );

  const completionPercentage =
    deadlines.length === 0
      ? 0
      : Math.round(
          (completed.length /
            deadlines.length) *
            100
        );

  return {
    summary: data.summary,

    deadlines,

    urgentDeadline,

    overdueDeadlines,

    dueToday,

    dueTomorrow,

    upcoming,

    completed,

    completionPercentage,

    totalRemainingMinutes,
  };
}

export function formatMinutes(
  minutes?: number
): string {
  if (!minutes) {
    return "—";
  }

  const hours = Math.floor(minutes / 60);

  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  }

  if (mins === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${mins} min`;
}

export function formatCompletion(
  value?: number
): string {
  if (value == null) {
    return "0%";
  }

  return `${Math.round(value)}%`;
}

export function getDeadlineStatusLabel(
  status: DeadlineStatus
): string {
  switch (status) {
    case "overdue":
      return "Overdue";

    case "due-today":
      return "Due Today";

    case "upcoming":
      return "Tomorrow";

    case "scheduled":
      return "Upcoming";

    case "completed":
      return "Completed";

    default:
      return "Unknown";
  }
}

export function getTimeRemaining(
  dueDate: Date
): string {
  const now = new Date();

  const diff =
    dueDate.getTime() - now.getTime();

  if (diff <= 0) {
    return "Past Due";
  }

  const hours = Math.floor(
    diff / (1000 * 60 * 60)
  );

  const days = Math.floor(hours / 24);

  if (days >= 1) {
    return `${days} day${days === 1 ? "" : "s"}`;
  }

  if (hours >= 1) {
    return `${hours} hr`;
  }

  const mins = Math.max(
    1,
    Math.floor(diff / (1000 * 60))
  );

  return `${mins} min`;
}

export function sortByDueDate(
  deadlines: Deadline[]
): Deadline[] {
  return [...deadlines].sort(
    (a, b) =>
      a.dueDate.getTime() -
      b.dueDate.getTime()
  );
}

export function getCompletionColor(
  completion?: number
): string {
  if (completion == null) {
    return "from-white/20 to-white/10";
  }

  if (completion >= 90) {
    return "from-emerald-500 to-emerald-300";
  }

  if (completion >= 70) {
    return "from-cyan-500 to-sky-400";
  }

  if (completion >= 40) {
    return "from-amber-500 to-yellow-300";
  }

  return "from-red-500 to-orange-400";
}