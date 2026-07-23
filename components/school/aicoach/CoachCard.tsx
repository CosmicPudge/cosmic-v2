"use client";

import { buildCoach } from "./coachHelpers";
import CoachHeader from "./CoachHeader";
import CoachInsight from "./CoachInsight";
import CoachPlan from "./CoachPlan";
import CoachRecommendation from "./CoachRecommendation";
import { CoachData } from "./coachTypes";

interface CoachCardProps {
  data: CoachData;
}

export default function CoachCard({
  data,
}: CoachCardProps) {
  const coach = buildCoach(data);

  return (
    <div className="space-y-8">
      {/* Header */}

      <CoachHeader coach={coach} />

      {/* Primary Recommendation */}

      <CoachRecommendation coach={coach} />

      {/* AI Insights */}

      <CoachInsight
        insights={coach.insights}
      />

      {/* Daily Execution Plan */}

      <CoachPlan
        tasks={coach.remainingTasks}
      />
    </div>
  );
}