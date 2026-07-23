import {
  SchoolAssignment,
  SchoolClass,
  SchoolEvent,
} from "../types";

import {
  buildToday,
  TodaySummary,
} from "./today";

import {
  buildRisks,
  SchoolRisk,
} from "./risks";

import {
  buildRecommendations,
  Recommendation,
} from "./recommendations";

export interface SchoolIntelligence {
  now: Date;

  overdueAssignments: SchoolAssignment[];

  assignmentsDueToday: SchoolAssignment[];

  assignmentsDueTomorrow: SchoolAssignment[];

  nextAssignment?: SchoolAssignment;

  nextClass?: SchoolClass;

  nextEvent?: SchoolEvent;

  upcomingClasses: SchoolClass[];

  afrotcEvents: SchoolEvent[];

  today: TodaySummary;

  risks: SchoolRisk[];

  recommendations: Recommendation[];
}

function isToday(date: Date, now: Date) {
  return date.toDateString() === now.toDateString();
}

function isTomorrow(date: Date, now: Date) {
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  return date.toDateString() === tomorrow.toDateString();
}

export function buildIntelligence(
  classes: SchoolClass[],
  assignments: SchoolAssignment[],
  events: SchoolEvent[]
): SchoolIntelligence {
  const now = new Date();

  const overdueAssignments = assignments.filter(
    (a) => !a.completed && a.due < now
  );

  const assignmentsDueToday = assignments.filter(
    (a) => !a.completed && isToday(a.due, now)
  );

  const assignmentsDueTomorrow = assignments.filter(
    (a) => !a.completed && isTomorrow(a.due, now)
  );

  const upcomingClasses = classes
    .filter((c) => c.start > now)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const nextClass = upcomingClasses[0];

  const nextAssignment = assignments
    .filter((a) => !a.completed)
    .sort((a, b) => a.due.getTime() - b.due.getTime())[0];

  const nextEvent = [...events]
    .filter((e) => e.start > now)
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0];

  const afrotcEvents = events.filter(
    (e) =>
      e.type === "afrotc" ||
      e.title.toLowerCase().includes("afrotc")
  );

  const today = buildToday(
    nextClass,
    nextAssignment,
    upcomingClasses,
    assignments
  );

  const risks = buildRisks({
    overdueAssignments,
    assignmentsDueToday,
    assignmentsDueTomorrow,
    nextAssignment,
    nextClass,
  });

  const recommendations =
    buildRecommendations({
      overdueAssignments,
      assignmentsDueToday,
      assignmentsDueTomorrow,
      nextAssignment,
      nextClass,
      risks,
    });

  return {
    now,

    overdueAssignments,

    assignmentsDueToday,

    assignmentsDueTomorrow,

    nextAssignment,

    nextClass,

    nextEvent,

    upcomingClasses,

    afrotcEvents,

    today,

    risks,

    recommendations,
  };
}