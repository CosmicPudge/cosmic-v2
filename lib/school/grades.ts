import { getSchoolOverview } from "./overview";
import type { SchoolGrade } from "./types";

export async function getRecentGrades(): Promise<SchoolGrade[]> {
  return (await getSchoolOverview()).grades;
}
