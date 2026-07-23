import {
  CoachData,
  CoachInsight,
  CoachPriority,
  CoachState,
  CoachTask,
} from "./coachTypes";

export const PRIORITY_APPEARANCE: Record<
  CoachPriority,
  {
    label: string;
    borderClass: string;
    glowClass: string;
    accentClass: string;
  }
> = {
  critical: {
    label: "Critical",
    borderClass: "border-red-500/30",
    glowClass: "from-red-500/20 via-red-500/5 to-transparent",
    accentClass: "text-red-300",
  },

  high: {
    label: "High",
    borderClass: "border-orange-500/30",
    glowClass: "from-orange-500/20 via-orange-500/5 to-transparent",
    accentClass: "text-orange-300",
  },

  medium: {
    label: "Medium",
    borderClass: "border-cyan-500/30",
    glowClass: "from-cyan-500/20 via-cyan-500/5 to-transparent",
    accentClass: "text-cyan-300",
  },

  low: {
    label: "Low",
    borderClass: "border-white/10",
    glowClass: "from-white/10 via-transparent to-transparent",
    accentClass: "text-white/70",
  },
};

export function getPriorityAppearance(
  priority: CoachPriority
) {
  return PRIORITY_APPEARANCE[priority];
}

const PRIORITY_ORDER: Record<CoachPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function sortTasks(
  tasks: CoachTask[]
): CoachTask[] {
  return [...tasks].sort((a, b) => {
    const priority =
      PRIORITY_ORDER[a.priority] -
      PRIORITY_ORDER[b.priority];

    if (priority !== 0) {
      return priority;
    }

    if (a.dueDate && b.dueDate) {
      return (
        a.dueDate.getTime() -
        b.dueDate.getTime()
      );
    }

    return 0;
  });
}

export function formatMinutes(
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

export function formatConfidence(
  confidence: number
): string {
  return `${Math.round(confidence)}%`;
}

export function getCompletionColor(
  percent: number
): string {
  if (percent >= 90) return "bg-emerald-500";
  if (percent >= 70) return "bg-cyan-500";
  if (percent >= 40) return "bg-orange-500";

  return "bg-red-500";
}

export function buildCoach(
  data: CoachData
): CoachState {
  const completedTasks = data.tasks.filter(
    (task) => task.completed
  );

  const remainingTasks = data.tasks.filter(
    (task) => !task.completed
  );

  const criticalTasks = sortTasks(
    remainingTasks.filter(
      (task) =>
        task.priority === "critical" ||
        task.priority === "high"
    )
  );

  const totalRemainingMinutes =
    remainingTasks.reduce(
      (sum, task) =>
        sum + task.estimatedMinutes,
      0
    );

  const completionPercentage =
    data.tasks.length === 0
      ? 100
      : Math.round(
          (completedTasks.length /
            data.tasks.length) *
            100
        );

  return {
    ...data,

    criticalTasks,

    remainingTasks: sortTasks(
      remainingTasks
    ),

    completedTasks: sortTasks(
      completedTasks
    ),

    completionPercentage,

    totalRemainingMinutes,

    nextTask: criticalTasks[0] ??
      remainingTasks[0],
  };
}

export function getInsightIconColor(
  insight: CoachInsight
): string {
  switch (insight.type) {
    case "warning":
      return "text-red-300";

    case "recommendation":
      return "text-cyan-300";

    case "achievement":
      return "text-emerald-300";

    case "schedule":
      return "text-orange-300";

    case "productivity":
      return "text-violet-300";

    default:
      return "text-white";
  }
}