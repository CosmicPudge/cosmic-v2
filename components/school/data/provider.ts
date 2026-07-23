import { SchoolDashboardData } from "./types";

export interface SchoolProvider {
  getDashboardData(): Promise<SchoolDashboardData>;

  refresh(): Promise<void>;
}