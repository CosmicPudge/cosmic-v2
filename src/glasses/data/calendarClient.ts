import { cosmicApi } from "./apiBase";

export type CosmicCalendarEvent = {
  title: string;
  start: string;
  end: string;
  location: string | null;
  calendarName: string | null;
  minutesUntil: number;
  allDay?: boolean;
  cancelled?: boolean;
};

export type CosmicCalendarResponse = {
  nextEvent: CosmicCalendarEvent | null;
};

const CALENDAR_API = cosmicApi("calendar");

export async function getNextCalendarEvent(): Promise<CosmicCalendarResponse> {
  const response = await fetch(CALENDAR_API, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Cosmic calendar API returned ${response.status}`,
    );
  }

  return response.json();
}
