import { SchoolProvider } from "../provider";
import { SchoolDashboardData } from "../types";
import { buildDashboard } from "../engine/engine";

export class MockProvider implements SchoolProvider {
  refresh(): Promise<void> {
      throw new Error("Method not implemented.");
  }
  async getDashboardData(): Promise<SchoolDashboardData> {
    return buildDashboard([]);
  }
}