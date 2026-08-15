import "server-only";

import { randomUUID } from "node:crypto";

import type {
  CalendarWriter,
  CreateCalendarEventInput,
  CreateCalendarEventResult,
  DeleteCalendarEventInput,
  UpdateCalendarEventInput,
  WritableCalendar,
} from "@/core/contracts";

import {
  createCalDavEvent,
  deleteCalDavEvent,
  discoverCalDav,
  discoverCalendars,
  fetchCalendarEvents,
  getCalDavCalendarId,
  updateCalDavEvent,
} from "./caldav";
import type { CalDavCalendar, CalDavConfig } from "./caldav";
import { normalizeCalDavCalendarData } from "./icalNormalizer";
import { getWritableEventTarget, removeWritableEventTarget } from "./writableEventRegistry";

export class CalendarDuplicateError extends Error {
  constructor() {
    super("A matching event already exists in this calendar.");
  }
}

export class AppleCalendarWriter implements CalendarWriter {
  private readonly config: CalDavConfig;
  private readonly defaultCalendarName: string | undefined;

  constructor() {
    const username = process.env.APPLE_CALENDAR_USERNAME;
    const password = process.env.APPLE_CALENDAR_PASSWORD;

    if (!username || !password) {
      throw new Error("Apple Calendar credentials are not configured.");
    }

    this.config = {
      username,
      password,
      serverUrl: process.env.APPLE_CALENDAR_SERVER ?? "https://caldav.icloud.com",
    };
    this.defaultCalendarName = process.env.COSMIC_DEFAULT_CALENDAR_NAME?.trim();
  }

  async getWritableCalendars(): Promise<WritableCalendar[]> {
    const calendars = await this.discoverWritableCalendars();

    return calendars.map((calendar) => ({
      id: getCalDavCalendarId(calendar),
      displayName: calendar.displayName,
    }));
  }

  async createEvent(
    input: CreateCalendarEventInput
  ): Promise<CreateCalendarEventResult> {
    if (!input.calendarId) {
      throw new Error("Choose a writable calendar.");
    }

    const calendars = await this.discoverWritableCalendars();
    const calendar = calendars.find(
      (candidate) => getCalDavCalendarId(candidate) === input.calendarId
    );

    if (!calendar) {
      throw new Error("The selected calendar is not writable.");
    }

    const startOfDay = new Date(input.start);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    const existing = normalizeCalDavCalendarData(
      await fetchCalendarEvents(this.config, calendar, startOfDay, endOfDay),
      {
        calendarName: calendar.displayName,
        calendarId: input.calendarId,
      },
      { start: startOfDay, end: endOfDay }
    );

    if (
      !input.confirmDuplicate &&
      existing.some(
        (event) =>
          event.title.trim().toLocaleLowerCase() ===
            input.title.trim().toLocaleLowerCase() &&
          event.start.getTime() === input.start.getTime() &&
          event.end.getTime() === input.end.getTime()
      )
    ) {
      throw new CalendarDuplicateError();
    }

    const uid = `${randomUUID()}@cosmic-os`;
    await createCalDavEvent(this.config, calendar, {
      uid,
      title: input.title,
      start: input.start,
      end: input.end,
      ...(input.description ? { description: input.description } : {}),
      ...(input.location ? { location: input.location } : {}),
    });

    return {
      id: uid,
      uid,
      calendarId: input.calendarId,
      calendarName: calendar.displayName,
      start: input.start,
      end: input.end,
    };
  }

  async updateEvent(
    input: UpdateCalendarEventInput
  ): Promise<CreateCalendarEventResult> {
    const target = await this.getWritableTarget(input.eventId);

    await updateCalDavEvent(this.config, target.resourceUrl, target.etag, {
      uid: target.uid ?? "",
      title: input.title,
      start: input.start,
      end: input.end,
      ...(input.description ? { description: input.description } : {}),
      ...(input.location ? { location: input.location } : {}),
    });

    return {
      id: input.eventId,
      ...(target.uid ? { uid: target.uid } : {}),
      calendarId: target.calendarId,
      calendarName: this.defaultCalendarName,
      start: input.start,
      end: input.end,
    };
  }

  async deleteEvent(input: DeleteCalendarEventInput): Promise<void> {
    const target = await this.getWritableTarget(input.eventId);
    await deleteCalDavEvent(this.config, target.resourceUrl, target.etag);
    removeWritableEventTarget(input.eventId);
  }

  private async getWritableTarget(eventId: string) {
    const target = getWritableEventTarget(eventId);

    if (!target || target.isRecurring || target.allDay || !target.uid) {
      throw new Error("This event is not available for editing.");
    }

    const calendars = await this.discoverWritableCalendars();
    const allowed = calendars.some(
      (calendar) => getCalDavCalendarId(calendar) === target.calendarId
    );

    if (!allowed) {
      throw new Error("This event is not available for editing.");
    }

    return target;
  }

  private async discoverWritableCalendars(): Promise<CalDavCalendar[]> {
    // Discovery does not prove write permission. Require an explicit, local
    // allowlist entry instead of exposing every VEVENT collection as writable.
    if (!this.defaultCalendarName) {
      return [];
    }

    const discovery = await discoverCalDav(this.config);
    const calendars = await discoverCalendars(this.config, discovery.calendarHomeUrl);

    return calendars.filter(
      (calendar) =>
        calendar.supportedComponents.includes("VEVENT") &&
        calendar.displayName === this.defaultCalendarName
    );
  }
}
