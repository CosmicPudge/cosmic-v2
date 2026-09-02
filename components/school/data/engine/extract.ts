import {
  SchoolAssignment,
  SchoolClass,
  SchoolEvent,
} from "../types";

export function extractClasses(
  events: SchoolEvent[]
): SchoolClass[] {
  return events
    .filter((event) => event.type === "class")
    .map((event) => ({
      id: event.id,
      name: event.title,
      start: event.start,
      end: event.end,
      location: event.location,
    }));
}

export function extractAssignments(
  events: SchoolEvent[]
): SchoolAssignment[] {
  return events
    .filter((event) => event.type === "assignment")
    .map((event) => ({
      id: event.id,
      title: event.title,
      due: event.allDay ? event.start : event.end,
      completed: false,
      priority: "medium",
    }));
}
