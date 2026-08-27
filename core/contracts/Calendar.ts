export type CalendarEventSource =
  | "apple"
  | "subscription"
  | "test"
  | "sports";

export type CalendarEventPriority =
  | "low"
  | "normal"
  | "high";

export type CalendarEventCategory =
  | "personal"
  | "school"
  | "sports";

export interface CalendarEvent {
  id: string;

  uid?: string;

  title: string;

  description?: string;

  start: Date;

  end: Date;

  location?: string;

  allDay?: boolean;

  calendarName?: string;

  calendarId?: string;

  writable?: boolean;

  writeId?: string;

  category?: CalendarEventCategory;

  source?: CalendarEventSource;

  sourceId?: string;
  sourceProvider?: string;
  sourceUrl?: string;
  sportsStatus?: string;

  priority?: CalendarEventPriority;

  startTimeZone?: string;

  endTimeZone?: string;

  isRecurring?: boolean;

  recurrenceWritable?: boolean;

  recurrenceId?: string;

  travelRequired: boolean;

  completed: boolean;
}

export interface CalendarSnapshot {
  today: CalendarEvent[];

  upcoming: CalendarEvent[];

  currentEvent?: CalendarEvent;

  nextEvent?: CalendarEvent;

  /** Present on kiosk snapshots so event dates follow the display timezone. */
  timeZone?: string;
  accountCalendarConnected?: boolean;
  accountCalendarError?: boolean;
  sportsCalendarError?: boolean;
}

export interface CalendarAvailability {
  available: boolean;

  blockingEvents: CalendarEvent[];

  nonBlockingEvents: CalendarEvent[];
}

export interface CreateCalendarEventInput {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  allDay?: boolean;
  calendarId?: string;
  confirmDuplicate?: boolean;
}

export interface CreateCalendarEventResult {
  id: string;
  uid?: string;
  calendarId: string;
  calendarName?: string;
  start: Date;
  end: Date;
}

export interface UpdateCalendarEventInput {
  eventId: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
}

export interface DeleteCalendarEventInput {
  eventId: string;
}

export interface WritableCalendar {
  id: string;
  displayName: string;
}

export interface CalendarWriter {
  getWritableCalendars(): Promise<WritableCalendar[]>;
  createEvent(
    input: CreateCalendarEventInput
  ): Promise<CreateCalendarEventResult>;
  updateEvent(
    input: UpdateCalendarEventInput
  ): Promise<CreateCalendarEventResult>;
  deleteEvent(input: DeleteCalendarEventInput): Promise<void>;
}
