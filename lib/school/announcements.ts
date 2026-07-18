import { getSchoolOverview } from "./overview";
import type { SchoolAnnouncement } from "./types";

export async function getSchoolAnnouncements(): Promise<SchoolAnnouncement[]> {
  return (await getSchoolOverview()).announcements;
}
