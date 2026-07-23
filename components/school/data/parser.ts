import ICAL from "ical.js";
import { SchoolEvent } from "./types";
import { classifyEvent } from "./classifier";

export function parseCanvasCalendar(ics: string): SchoolEvent[] {
  const jcal = ICAL.parse(ics);
  const calendar = new ICAL.Component(jcal);

  const vevents = calendar.getAllSubcomponents("vevent");

  return vevents.map((component) => {
    const event = new ICAL.Event(component);

    return {
      id: event.uid,
      title: event.summary ?? "Untitled",

      start: event.startDate.toJSDate(),
      end: event.endDate.toJSDate(),

      description: event.description ?? undefined,
      location: event.location ?? undefined,

      type: classifyEvent(
        event.summary ?? "",
        event.description ?? ""
      ),

      source: "canvas-calendar",
    };
  });
}