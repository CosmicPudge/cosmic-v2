import { SchoolDashboardData } from "../types";

import { calculateMetrics } from "./metrics";
import { calculateWorkload } from "./workload";
import { calculateAssignmentRisk } from "./risk";
import { generateRecommendations } from "./recommendations";

export interface IntelligenceContext {
  data: SchoolDashboardData;

  metrics: ReturnType<typeof calculateMetrics>;

  workload: ReturnType<typeof calculateWorkload>;

  risks: ReturnType<typeof calculateAssignmentRisk>;

  recommendations: ReturnType<typeof generateRecommendations>;
}

export function buildIntelligenceContext(
  data: SchoolDashboardData
): IntelligenceContext {
  const metrics = calculateMetrics(data);

  const workload = calculateWorkload(data);

  const risks = calculateAssignmentRisk(
    data.assignments
  );

  const recommendations =
    generateRecommendations(data);

  return {
    data,

    metrics,

    workload,

    risks,

    recommendations,
  };
}