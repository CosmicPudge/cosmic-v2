import type { CalendarEvent } from "@/core/contracts";
import type { CalendarProvider } from "@/engines/calendar";

export class TestCalendarProvider
  implements CalendarProvider
{
  async getEvents(): Promise<CalendarEvent[]> {
    const now = new Date();

    const todayAt = (
      hours: number,
      minutes = 0
    ) => {
      const date = new Date(now);

      date.setHours(
        hours,
        minutes,
        0,
        0
      );

      return date;
    };

    const tomorrow = new Date(now);

    tomorrow.setDate(
      tomorrow.getDate() + 1
    );

    tomorrow.setHours(
      10,
      0,
      0,
      0
    );

    return [
      {
        id: "test-class",
        title: "Test Class",
        description:
          "Temporary Cosmic calendar test event.",
        start: todayAt(11, 0),
        end: todayAt(12, 0),
        location: "Test Classroom",
        travelRequired: false,
        completed: false,
      },

      {
        id: "test-meeting",
        title: "Test Meeting",
        description:
          "Temporary Cosmic calendar test event.",
        start: todayAt(14, 0),
        end: todayAt(14, 30),
        location: "Cosmic Test",
        travelRequired: false,
        completed: false,
      },

      {
        id: "test-tomorrow",
        title: "Tomorrow Event",
        description:
          "Temporary Cosmic calendar test event.",
        start: tomorrow,
        end: new Date(
          tomorrow.getTime() +
            60 * 60 * 1000
        ),
        location: "Test Location",
        travelRequired: false,
        completed: false,
      },
    ];
  }
}