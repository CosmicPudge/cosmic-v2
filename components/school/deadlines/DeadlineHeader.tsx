"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import {
  DeadlinesState,
} from "./deadlineTypes";
import {
  formatMinutes,
} from "./deadlineHelpers";

interface DeadlineHeaderProps {
  deadlines: DeadlinesState;
}

export default function DeadlineHeader({
  deadlines,
}: DeadlineHeaderProps) {
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
          <div className="flex items-center gap-3 text-orange-300">
            <CalendarClock size={22} />

            <span className="text-sm font-semibold uppercase tracking-[0.25em]">
              Deadlines
            </span>
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
            Workload Overview
          </h1>

          <p className="mt-3 max-w-2xl text-white/60 leading-relaxed">
            Prioritize upcoming assignments, identify overdue work,
            and let Cosmic recommend the most effective order to
            complete everything on time.
          </p>
        </div>

        {/* Metrics */}

        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            icon={<AlertTriangle size={18} />}
            label="Overdue"
            value={String(deadlines.summary.overdue)}
            color="text-red-300"
          />

          <MetricCard
            icon={<CalendarClock size={18} />}
            label="Due Today"
            value={String(deadlines.summary.dueToday)}
            color="text-orange-300"
          />

          <MetricCard
            icon={<Clock3 size={18} />}
            label="Work Remaining"
            value={formatMinutes(
              deadlines.totalRemainingMinutes
            )}
            color="text-cyan-300"
          />

          <MetricCard
            icon={<CheckCircle2 size={18} />}
            label="Completed"
            value={`${deadlines.completionPercentage}%`}
            color="text-emerald-300"
          />
        </div>
      </div>

      {/* Summary */}

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <SummaryCard
          title="Most Urgent"
          value={
            deadlines.urgentDeadline
              ? deadlines.urgentDeadline.title
              : "Nothing Urgent"
          }
        />

        <SummaryCard
          title="Upcoming"
          value={`${deadlines.summary.upcoming} Remaining`}
        />

        <SummaryCard
          title="Estimated Work"
          value={formatMinutes(
            deadlines.totalRemainingMinutes
          )}
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

      <div className="mt-2 text-lg font-semibold text-white">
        {value}
      </div>
    </div>
  );
}