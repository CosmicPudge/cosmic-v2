import { getSchoolOverview } from "./overview";
import type { SchoolAssignment } from "./types";

export async function getTodayAssignments(): Promise<SchoolAssignment[]> {
  return (await getSchoolOverview()).assignments;
}
