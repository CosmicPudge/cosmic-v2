import { getSchoolOverview } from "./overview";
import type { SchoolClass } from "./types";

export async function getTodayClasses(): Promise<SchoolClass[]> {
  return (await getSchoolOverview()).classes;
}
