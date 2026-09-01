import { SchoolDashboardData } from "../types";

import { buildIntelligenceContext } from "./context";
import { generateDailyBriefing } from "./briefing";
import { buildDailyPlan } from "./planner";
import { buildTimeline } from "./timeline";
import { buildPerformance } from "./performance";
import { buildNotifications } from "./notifications";
import type { SchoolSnapshot } from "@/services/school/domain";


export interface SchoolIntelligence {
    metrics: ReturnType<
        typeof buildIntelligenceContext
    >["metrics"];

    workload: ReturnType<
        typeof buildIntelligenceContext
    >["workload"];

    risks: ReturnType<
        typeof buildIntelligenceContext
    >["risks"];

    recommendations: ReturnType<
        typeof buildIntelligenceContext
    >["recommendations"];

    briefing: ReturnType<
        typeof generateDailyBriefing
    >;

    plan: ReturnType<
        typeof buildDailyPlan
    >;
    timeline: ReturnType<typeof buildTimeline>;
    performance: ReturnType<
  typeof buildPerformance
>;
notifications: ReturnType<
  typeof buildNotifications
>;
}

export function buildSchoolIntelligence(
    data: SchoolDashboardData, snapshot?: SchoolSnapshot
): SchoolIntelligence {
    const context =
        buildIntelligenceContext(data, snapshot);

    return {
        metrics: context.metrics,

        workload: context.workload,

        risks: context.risks,

        recommendations:
            context.recommendations,

        briefing:
            generateDailyBriefing(context),

        plan:
            buildDailyPlan(context),
        timeline: buildTimeline(context),
        performance: buildPerformance(context),
        notifications: buildNotifications(context),
    };
}
