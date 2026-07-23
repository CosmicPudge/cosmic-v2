import {
  AFROTCData,
  AFROTCEvent,
  AFROTCState,
  ReadinessItem,
  ReadinessStatus,
} from "./afrotcTypes";

export const READINESS_APPEARANCE: Record<
  ReadinessStatus,
  {
    label: string;
    className: string;
  }
> = {
  complete: {
    label: "Complete",
    className:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },

  attention: {
    label: "Attention",
    className:
      "border-amber-500/20 bg-amber-500/10 text-amber-300",
  },

  missing: {
    label: "Missing",
    className:
      "border-red-500/20 bg-red-500/10 text-red-300",
  },
};

export function getReadinessAppearance(
  status: ReadinessStatus
) {
  return READINESS_APPEARANCE[status];
}

export function sortEvents(
  events: AFROTCEvent[]
): AFROTCEvent[] {
  return [...events].sort(
    (a, b) =>
      a.start.getTime() - b.start.getTime()
  );
}

export function getNextEvent(
  events: AFROTCEvent[]
): AFROTCEvent | undefined {
  const now = Date.now();

  return sortEvents(events).find(
    (event) => event.start.getTime() >= now
  );
}

export function calculateReadinessSummary(
  readiness: ReadinessItem[]
) {
  const completed = readiness.filter(
    (item) => item.status === "complete"
  ).length;

  const total = readiness.length;

  const score =
    total === 0
      ? 100
      : Math.round((completed / total) * 100);

  return {
    completed,
    total,
    score,
  };
}

export function formatEventDate(
  date: Date
) {
  return new Intl.DateTimeFormat(
    undefined,
    {
      weekday: "short",
      month: "short",
      day: "numeric",
    }
  ).format(date);
}

export function formatEventTime(
  date: Date
) {
  return new Intl.DateTimeFormat(
    undefined,
    {
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(date);
}

export function formatCountdown(
  date: Date
) {
  const diff =
    date.getTime() - Date.now();

  if (diff <= 0) {
    return "Now";
  }

  const minutes = Math.floor(
    diff / (1000 * 60)
  );

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours} hr`;
  }

  const days = Math.floor(
    hours / 24
  );

  return `${days} day${days === 1 ? "" : "s"}`;
}

export function buildAFROTC(
  data: AFROTCData
): AFROTCState {
  const upcomingEvents =
    sortEvents(data.events);

  return {
    cadet: data.cadet,

    uniform: data.uniform,

    pt: data.pt,

    nextEvent:
      getNextEvent(upcomingEvents),

    upcomingEvents,

    readiness: data.readiness,

    readinessSummary:
      calculateReadinessSummary(
        data.readiness
      ),
  };
}