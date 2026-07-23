import {
  PriorityData,
  PriorityItem,
  PriorityState,
} from "./priorityTypes";

export function sortPriorities(
  priorities: PriorityItem[]
): PriorityItem[] {
  return [...priorities].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;

    if (b.score !== a.score) {
      return b.score - a.score;
    }

    if (a.dueAt && b.dueAt) {
      return (
        a.dueAt.getTime() -
        b.dueAt.getTime()
      );
    }

    if (a.dueAt) return -1;
    if (b.dueAt) return 1;

    return a.title.localeCompare(b.title);
  });
}

export function getCriticalPriorities(
  priorities: PriorityItem[]
): PriorityItem[] {
  return priorities.filter(
    (priority) =>
      priority.level === "critical"
  );
}

export function getHighPriorities(
  priorities: PriorityItem[]
): PriorityItem[] {
  return priorities.filter(
    (priority) =>
      priority.level === "high"
  );
}

export function getMediumPriorities(
  priorities: PriorityItem[]
): PriorityItem[] {
  return priorities.filter(
    (priority) =>
      priority.level === "medium"
  );
}

export function getLowPriorities(
  priorities: PriorityItem[]
): PriorityItem[] {
  return priorities.filter(
    (priority) =>
      priority.level === "low"
  );
}

export function getCompletedPriorities(
  priorities: PriorityItem[]
): PriorityItem[] {
  return priorities.filter(
    (priority) =>
      priority.completed ||
      priority.status === "completed"
  );
}

export function buildPriorities(
  data: PriorityData
): PriorityState {
  const priorities = sortPriorities(
    data.priorities
  );

  return {
    priorities,

    summary: {
      total: priorities.length,

      critical:
        getCriticalPriorities(
          priorities
        ).length,

      high: getHighPriorities(
        priorities
      ).length,

      medium:
        getMediumPriorities(
          priorities
        ).length,

      low: getLowPriorities(
        priorities
      ).length,

      completed:
        getCompletedPriorities(
          priorities
        ).length,
    },

    recommendation:
      data.recommendation,
  };
}