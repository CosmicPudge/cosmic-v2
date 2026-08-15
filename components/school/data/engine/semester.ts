import { SemesterInfo } from "../types";

export function buildSemester(): SemesterInfo {
  const semester =
    process.env.COSMIC_SCHOOL_TERM_NAME?.trim() ||
    "Current term";

  return {
    semester,
    week: 0,
    progress: 0,
  };
}
