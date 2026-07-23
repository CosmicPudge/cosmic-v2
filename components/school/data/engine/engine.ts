import {
  SchoolAnnouncement,
  SchoolDashboardData,
  SchoolEvent,
} from "../types";

import { buildMission } from "./mission";
import { buildStats } from "./stats";
import { buildSemester } from "./semester";
import { buildIntelligence } from "./intelligence";
import { buildHeadline } from "./headline";
import { buildStatus } from "./status";
import { buildFocus } from "./focus";
import { buildTimeline } from "./timeline";
import { buildPriorities } from "./priorities";

import {
  extractAssignments,
  extractClasses,
} from "./extract";

export function buildDashboard(
  events: SchoolEvent[]
): SchoolDashboardData {
  const classes = extractClasses(events);

  const assignments = extractAssignments(events);

  const intelligence = buildIntelligence(
    classes,
    assignments,
    events
  );
  const priorities = buildPriorities(assignments);

const mission = buildMission(
  intelligence,
  priorities
);

const headline = buildHeadline(
  intelligence,
  mission
);

const status = buildStatus(
  intelligence
);

  const announcements: SchoolAnnouncement[] = [];

  return {
    mission,

headline,

status,

    focus: buildFocus(
  assignments,
  priorities
),

    timeline: buildTimeline(events),

    stats: buildStats(
      classes,
      assignments,
      events
    ),

    semester: buildSemester(),

    events,

    classes,

    assignments,

    announcements,
  };
}