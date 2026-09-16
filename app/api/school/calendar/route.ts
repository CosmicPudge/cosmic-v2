import { NextResponse } from "next/server";
import { requireSchoolAccessContext } from "@/services/school/access";
import { getSchoolDataForAccount } from "@/services/school/server";
import { planAcademicState } from "@/services/school/planning/academicPlanner";
import { narrateRecommendations } from "@/services/school/planning/recommendationNarrator";
import { SCHOOL_AI_ENABLED } from "@/services/school/capabilities";

export async function GET(request: Request) {
  try {
    const access = await requireSchoolAccessContext(request);
    if (access.storageOwner.kind !== "legacy-account") {
      return NextResponse.json({ events: [], error: "storage-unavailable-in-personal-mode" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    const school = await getSchoolDataForAccount(access.storageOwner.accountId);
    const recommendations = planAcademicState(school.snapshot).recommendations;
    const recommendationNarration = SCHOOL_AI_ENABLED ? await narrateRecommendations({ primaryRecommendation: recommendations[0], nextRecommendations: recommendations.slice(1, 3), academicContext: { nextClassName: school.snapshot.events.find((event) => event.type === "class" && event.start > new Date())?.title, minutesUntilNextClass: null } }) : null;
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
