"use client";

import { motion } from "framer-motion";
import {
  Brain,
  CheckCircle2,
  Clock3,
  Target,
} from "lucide-react";

import {
  formatConfidence,
  formatMinutes,
} from "./coachHelpers";
import { CoachState } from "./coachTypes";

interface CoachHeaderProps {
  coach: CoachState;
}

export default function CoachHeader({
  coach,
}: CoachHeaderProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
        rounded-[32px]
        border
        border-white/10
        bg-white/[0.045]
        backdrop-blur-3xl
        p-8
      "
    >
      <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
        {/* Left */}

        <div>
          <div className="flex items-center gap-3 text-cyan-300">
            <Brain size={22} />

            <span className="text-sm font-semibold uppercase tracking-[0.25em]">
              AI Coach
            </span>
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
            Today's Mission
          </h1>

          <p className="mt-3 max-w-3xl text-white/60 leading-relaxed">
            {coach.mission.title}
          </p>

          {coach.mission.subtitle && (
            <p className="mt-2 text-white/45">
              {coach.mission.subtitle}
            </p>
          )}
        </div>

        {/* Metrics */}

        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            icon={<Target size={18} />}
            label="Mission Confidence"
            value={formatConfidence(
              coach.mission.confidence
            )}
            color="text-cyan-300"
          />

          <MetricCard
            icon={<Clock3 size={18} />}
            label="Work Remaining"
            value={formatMinutes(
              coach.totalRemainingMinutes
            )}
            color="text-orange-300"
          />

          <MetricCard
            icon={<Brain size={18} />}
            label="Tasks Remaining"
            value={String(
              coach.remainingTasks.length
            )}
            color="text-violet-300"
          />

          <MetricCard
            icon={<CheckCircle2 size={18} />}
            label="Completed"
            value={`${coach.completionPercentage}%`}
            color="text-emerald-300"
          />
        </div>
      </div>

      {/* Summary */}

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <SummaryCard
          title="Next Priority"
          value={
            coach.nextTask
              ? coach.nextTask.title
              : "Everything Complete"
          }
        />

        <SummaryCard
          title="Estimated Work"
          value={formatMinutes(
            coach.totalRemainingMinutes
          )}
        />

        <SummaryCard
          title="AI Summary"
          value={
            coach.summary.aiSummary ??
            "You're on track to complete today's goals."
          }
        />
      </div>
    </motion.div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

function MetricCard({
  icon,
  label,
  value,
  color,
}: MetricCardProps) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-white/[0.03]
        p-4
      "
    >
      <div className={`flex items-center gap-2 ${color}`}>
        {icon}
      </div>

      <div className="mt-3 text-xs uppercase tracking-[0.15em] text-white/45">
        {label}
      </div>

      <div className="mt-1 text-2xl font-semibold text-white">
        {value}
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
}

function SummaryCard({
  title,
  value,
}: SummaryCardProps) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-white/[0.03]
        p-5
      "
    >
      <div className="text-xs uppercase tracking-[0.15em] text-white/45">
        {title}
      </div>

      <div className="mt-2 text-lg font-semibold text-white leading-relaxed">
        {value}
      </div>
    </div>
  );
}