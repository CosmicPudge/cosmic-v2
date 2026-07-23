"use client";

import { Sparkles } from "lucide-react";

import SchoolCard from "../ui/SchoolCard";
import {
  DailyBriefing,
  Recommendation,
  WorkloadLevel,
} from "../data/intelligence";

interface Props {
  briefing: DailyBriefing;
  recommendations: Recommendation[];
  workload: WorkloadLevel;
}

const workloadColor: Record<WorkloadLevel, string> = {
  light: "text-emerald-400",
  moderate: "text-yellow-400",
  heavy: "text-orange-400",
  critical: "text-red-400",
};

export default function AICoachCard({
  briefing,
  recommendations,
  workload,
}: Props) {
  return (
    <SchoolCard
      title="Cosmic AI Coach"
      subtitle={briefing.greeting}
      accent="purple"
    >
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles
              size={18}
              className="text-violet-300"
            />

            <span className="font-semibold text-white">
              {briefing.headline}
            </span>
          </div>

          <p className="mt-2 text-sm text-white/70">
            {briefing.summary}
          </p>
        </div>

        <div>
          <div className="mb-2 text-xs uppercase tracking-wide text-white/50">
            Today's Workload
          </div>

          <div
            className={`text-lg font-semibold capitalize ${workloadColor[workload]}`}
          >
            {workload}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs uppercase tracking-wide text-white/50">
            Recommended Next Steps
          </div>

          <ul className="space-y-2">
            {recommendations.map((item) => (
              <li
                key={item.id}
                className="rounded-xl bg-white/5 p-3 text-sm text-white/80"
              >
                <div className="font-medium">
                  {item.title}
                </div>

                <div className="mt-1 text-white/50">
                  {item.description}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SchoolCard>
  );
}