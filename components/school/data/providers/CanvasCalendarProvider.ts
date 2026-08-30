import { SchoolProvider } from "../provider";
import { SchoolDashboardData } from "../types";
import { parseCanvasCalendarWithDiagnostics, type CanvasCalendarDiagnostics } from "../parser";
import { buildDashboard } from "../engine/engine";

export interface CanvasDashboardResult {
  data: SchoolDashboardData;
  diagnostics: CanvasCalendarDiagnostics;
}

export class CanvasCalendarProvider implements SchoolProvider {
  constructor(private readonly feedUrl?: string) {}
  refresh(): Promise<void> {
      return Promise.resolve();
  }
  async getDashboardData(): Promise<SchoolDashboardData> {
    return (await this.getDashboardDataWithDiagnostics()).data;
  }

  async getDashboardDataWithDiagnostics(): Promise<CanvasDashboardResult> {
    const url = this.feedUrl ?? process.env.CANVAS_CALENDAR_URL;

    if (!url) {
      return {
        data: buildDashboard([]),
        diagnostics: { totalIcsEvents: 0, parsedEvents: 0, assignments: 0, classes: 0, otherEvents: 0 },
      };
    }

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to download Canvas calendar.");
    }

    const text = await response.text();

    const parsed = parseCanvasCalendarWithDiagnostics(text);

    return { data: buildDashboard(parsed.events), diagnostics: parsed.diagnostics };
  }
}
