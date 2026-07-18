import { getSchoolOverview } from "./overview";
import type { SchoolOverviewData } from "./types";

export function getSchoolDashboard(): Promise<SchoolOverviewData> {
  return getSchoolOverview();
}
