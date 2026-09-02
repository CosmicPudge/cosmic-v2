import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { getSchoolDataForAccount } from "@/services/school/server";
import { planAcademicState } from "@/services/school/planning/academicPlanner";
import { narrateRecommendations } from "@/services/school/planning/recommendationNarrator";

export async function GET(request: Request) {
  await requireSchoolAccess(request);
  try {
    const account = await requireSchoolAccess(request);
    const school = await getSchoolDataForAccount(account.id);
    const recommendations = planAcademicState(school.snapshot).recommendations;
    const recommendationNarration = await narrateRecommendations({ primaryRecommendation: recommendations[0], nextRecommendations: recommendations.slice(1, 3), academicContext: { nextClassName: school.snapshot.events.find((event) => event.type === "class" && event.start > new Date())?.title, minutesUntilNextClass: null } });
    return NextResponse.json({ ...school, recommendationNarration }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      {
        events: [],
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
