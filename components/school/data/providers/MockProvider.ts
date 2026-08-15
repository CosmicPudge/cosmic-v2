import { SchoolProvider } from "../provider";
import { SchoolDashboardData } from "../types";
import { buildDashboard } from "../engine/engine";

export class MockProvider implements SchoolProvider {
  refresh(): Promise<void> {
      return Promise.resolve();
  }
  async getDashboardData(): Promise<SchoolDashboardData> {
    return buildDashboard([]);
  }
}
