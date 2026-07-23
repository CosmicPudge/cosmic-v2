"use client";

import SchoolBadge from "../ui/SchoolBadge";
import SchoolCard from "../ui/SchoolCard";

import type { AssignmentRisk } from "../data/intelligence/risk";

interface DeadlinesCardProps {
  risks: AssignmentRisk[];
}

export default function DeadlinesCard({
  risks,
}: DeadlinesCardProps) {
  const deadlines = risks.slice(0, 5);

  return (
    <SchoolCard
      title="Priority Queue"
      subtitle="Assignments ranked by risk"
      accent="orange"
    >
      <div className="space-y-3">
        {deadlines.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/55">
            You're all caught up.
          </div>
        ) : (
          deadlines.map((risk) => (
            <DeadlineRow
              key={risk.assignment.id}
              risk={risk}
            />
          ))
        )}
      </div>
    </SchoolCard>
  );
}

function DeadlineRow({
  risk,
}: {
  risk: AssignmentRisk;
}) {
  const assignment = risk.assignment;

 const badgeColor =
  risk.level === "critical"
    ? "red"
    : risk.level === "high"
    ? "orange"
    : risk.level === "medium"
    ? "orange"
    : "green";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate font-medium text-white">
            {assignment.title}
          </div>

          <div className="mt-1 text-sm text-white/55">
            {assignment.course ?? "No course"}
          </div>

          <div className="mt-2 text-xs text-white/40">
            Due{" "}
            {assignment.due.toLocaleDateString([], {
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>

        <SchoolBadge color={badgeColor}>
          {risk.level.toUpperCase()}
        </SchoolBadge>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-white/45">
          <span>Risk Score</span>
          <span>{risk.score}</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-white/70 transition-all"
            style={{
              width: `${Math.min(risk.score, 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}