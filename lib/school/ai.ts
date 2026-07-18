import { getSchoolOverview } from "./overview";
import type { SchoolRecommendation } from "./types";

export async function getSchoolRecommendations(): Promise<SchoolRecommendation[]> {
  return (await getSchoolOverview()).recommendations;
}
