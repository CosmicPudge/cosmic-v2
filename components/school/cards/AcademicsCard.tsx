"use client";

import SchoolCard from "../ui/SchoolCard";
import SchoolMetric from "../ui/SchoolMetric";
import SchoolProgress from "../ui/SchoolProgress";
import SchoolBadge from "../ui/SchoolBadge";

import type { SemesterInfo } from "../data/types";
import type { AcademicPerformance } from "../data/intelligence/performance";

interface AcademicsCardProps {
  performance: AcademicPerformance;
  semester: SemesterInfo;
}

export default function AcademicsCard({
  performance,
  semester,
}: AcademicsCardProps) {
  const badgeColor =
    performance.status === "excellent"
      ? "green"
      : performance.status === "good"
      ? "blue"
      : performance.status === "warning"
      ? "orange"
      : "red";

  const badgeText =
    performance.status.charAt(0).toUpperCase() +
    performance.status.slice(1);

  return (
    <SchoolCard
      title="Academics"
      subtitle="Current academic health"
      accent="green"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <SchoolBadge color={badgeColor}>
            {badgeText}
          </SchoolBadge>

          <div className="text-sm text-white/50">
            Week {semester.week}
          </div>
        </div>

        <SchoolProgress
          value={performance.completionRate}
          color="green"
          label={`${performance.completionRate}% Assignment Completion`}
        />

        <div className="grid grid-cols-2 gap-4">
          <SchoolMetric
            label="Completed"
            value={performance.completedAssignments}
          />

          <SchoolMetric
            label="Remaining"
            value={performance.remainingAssignments}
          />

          <SchoolMetric
            label="Overdue"
            value={performance.overdueAssignments}
          />

          <SchoolMetric
            label="Semester"
            value={semester.semester}
          />
        </div>

        {performance.needsAttention && (
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
            <div className="text-xs uppercase tracking-wide text-orange-300">
              Needs Attention
            </div>

            <div className="mt-1 text-white">
              {performance.needsAttention}
            </div>
          </div>
        )}
      </div>
    </SchoolCard>
  );
}