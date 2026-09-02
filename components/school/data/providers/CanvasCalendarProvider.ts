import { SchoolProvider } from "../provider";
import { SchoolDashboardData } from "../types";
import { parseCanvasCalendarWithDiagnostics, type CanvasCalendarDiagnostics } from "../parser";
import { buildDashboard } from "../engine/engine";

export interface CanvasDashboardResult {
  data: SchoolDashboardData;
  diagnostics: CanvasCalendarDiagnostics;
}
const refreshCache = new Map<string, { expiresAt: number; result: CanvasDashboardResult }>();

export async function fetchCanvasCalendarEvents(feedUrl: string, fetchImpl: typeof fetch = fetch) {
  const response = await fetchImpl(feedUrl, { cache: "no-store", headers: { Accept: "text/calendar" } });
  if (!response.ok) throw new Error("Unable to download Canvas calendar.");
  return parseCanvasCalendarWithDiagnostics(await response.text());
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

    const cached = refreshCache.get(url); if (cached && cached.expiresAt > Date.now()) return cached.result;

    const parsed = await fetchCanvasCalendarEvents(url);
    const result = { data: buildDashboard(parsed.events), diagnostics: parsed.diagnostics }; refreshCache.set(url, { expiresAt: Date.now() + 30 * 60 * 1000, result }); return result;
  }
}
