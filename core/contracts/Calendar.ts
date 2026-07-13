export interface CalendarEvent {
  id: string;

  title: string;

  description?: string;

  start: Date;

  end: Date;

  location?: string;

  travelRequired: boolean;

  completed: boolean;
}

export interface CalendarSnapshot {
  today: CalendarEvent[];

  upcoming: CalendarEvent[];

  nextEvent?: CalendarEvent;
}