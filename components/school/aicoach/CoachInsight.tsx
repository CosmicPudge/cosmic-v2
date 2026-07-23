"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  Brain,
  CalendarClock,
  TrendingUp,
} from "lucide-react";

import { getInsightIconColor } from "./coachHelpers";
import type { CoachInsight as CoachInsightType } from "./coachTypes";

interface CoachInsightProps {
  insights: CoachInsightType[];
}

export default function CoachInsight({
  insights,
}: CoachInsightProps) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-3">
          <Brain
            size={20}
            className="text-cyan-300"
          />

          <h2 className="text-2xl font-semibold text-white">
            AI Insights
          </h2>
        </div>

        <p className="mt-2 text-white/60">
          Observations and recommendations generated from
          today's workload and schedule.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {insights.map((insight, index) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

interface InsightCardProps {
  insight: CoachInsightType;
  index: number;
}

function InsightCard({
  insight,
  index,
}: InsightCardProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: index * 0.05,
      }}
      className="
        rounded-3xl
        border
        border-white/10
        bg-white/[0.04]
        backdrop-blur-3xl
        p-6
      "
    >
      <div className="flex items-start gap-4">
        <div className={getInsightIconColor(insight)}>
          {getInsightIcon(insight.type)}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-white">
              {insight.title}
            </h3>

            <PriorityBadge
              priority={insight.priority}
            />
          </div>

          <p className="mt-3 leading-relaxed text-white/65">
            {insight.message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function getInsightIcon(
  type: CoachInsightType["type"]
) {
  switch (type) {
    case "warning":
      return <AlertTriangle size={22} />;

    case "recommendation":
      return <Brain size={22} />;

    case "achievement":
      return <Award size={22} />;

    case "schedule":
      return <CalendarClock size={22} />;

    case "productivity":
      return <TrendingUp size={22} />;

    default:
      return <Brain size={22} />;
  }
}

interface PriorityBadgeProps {
  priority: CoachInsightType["priority"];
}

function PriorityBadge({
  priority,
}: PriorityBadgeProps) {
  const styles = {
    critical:
      "border-red-500/20 bg-red-500/10 text-red-300",
    high:
      "border-orange-500/20 bg-orange-500/10 text-orange-300",
    medium:
      "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    low:
      "border-white/10 bg-white/5 text-white/70",
  };

  return (
    <div
      className={`
        rounded-full
        border
        px-3
        py-1
        text-xs
        font-semibold
        uppercase
        tracking-[0.15em]
        ${styles[priority]}
      `}
    >
      {priority}
    </div>
  );
}