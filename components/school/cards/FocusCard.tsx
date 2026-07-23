"use client";

import SchoolCard from "../ui/SchoolCard";
import SchoolProgress from "../ui/SchoolProgress";

import { DailyPlan } from "../data/intelligence/planner";

interface FocusCardProps {
  plan: DailyPlan;
}

export default function FocusCard({
  plan,
}: FocusCardProps) {
  const task = plan.nextTask;

  if (!task) {
    return (
      <SchoolCard
        title="Today's Mission"
        subtitle="Everything Complete"
        badge="DONE"
        accent="green"
      >
        <div className="flex h-full items-center justify-center text-center">
          <p className="text-white/70">
            You're all caught up.
            <br />
            Enjoy the rest of your day!
          </p>
        </div>
      </SchoolCard>
    );
  }

  const accent =
    task.riskScore >= 90
      ? "red"
      : task.riskScore >= 70
      ? "orange"
      : "blue";

  return (
    <SchoolCard
      title="Today's Mission"
      subtitle={task.course ?? "General"}
      badge={task.shouldStartNow ? "START NOW" : "PLANNED"}
      accent={accent}
    >
      <div className="flex h-full flex-col justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {task.title}
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-white/65">
            {task.reason}
          </p>
        </div>

        <SchoolProgress
          value={plan.confidence}
          color={accent}
          label="Planner Confidence"
        />

        <div className="grid grid-cols-2 gap-4">
          <Metric
            label="Estimated"
            value={`${task.estimatedMinutes} min`}
          />

          <Metric
            label="Next"
            value={plan.afterNext ?? "Finished"}
          />
        </div>
      </div>
    </SchoolCard>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-wide text-white/45">
        {label}
      </div>

      <div className="mt-2 text-lg font-semibold text-white">
        {value}
      </div>
    </div>
  );
}