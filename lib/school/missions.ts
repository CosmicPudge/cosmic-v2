import { getSchoolOverview } from "./overview";
import type { SchoolOverviewData } from "./types";

export async function getActiveSchoolMission(): Promise<SchoolOverviewData["mission"]> {
  return (await getSchoolOverview()).mission;
}
