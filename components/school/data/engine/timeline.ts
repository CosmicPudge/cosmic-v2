import { SchoolEvent } from "../types";
import { sortEvents } from "./utils";

export function buildTimeline(events: SchoolEvent[]) {
  return sortEvents(events).map(event => ({
    id: event.id,
    title: event.title,
    subtitle: event.description,
    start: event.start,
    end: event.end,
    type: event.type,
  }));
}