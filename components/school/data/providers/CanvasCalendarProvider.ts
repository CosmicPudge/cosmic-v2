import { SchoolProvider } from "../provider";
import { SchoolDashboardData } from "../types";
import { parseCanvasCalendar } from "../parser";
import { buildDashboard } from "../engine/engine";

export class CanvasCalendarProvider implements SchoolProvider {
  constructor(private readonly feedUrl?: string) {}
  refresh(): Promise<void> {
      return Promise.resolve();
  }
  async getDashboardData(): Promise<SchoolDashboardData> {
    const url = this.feedUrl ?? process.env.CANVAS_CALENDAR_URL;

    if (!url) {
  return buildDashboard([]);
}

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to download Canvas calendar.");
    }

    const text = await response.text();

    const events = parseCanvasCalendar(text);

return buildDashboard(events);
  }
}
