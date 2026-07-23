"use client";

import { motion } from "framer-motion";
import {
  CalendarClock,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";

import {
  formatCountdown,
  getReadinessAppearance,
} from "./afrotcHelpers";
import { AFROTCState } from "./afrotcTypes";

interface AFROTCHeaderProps {
  state: AFROTCState;
}

export default function AFROTCHeader({
  state,
}: AFROTCHeaderProps) {
  const readiness = getReadinessAppearance(
    state.readinessSummary.score === 100
      ? "complete"
      : state.readinessSummary.score >= 70
        ? "attention"
        : "missing"
  );

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: -16,
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
        <div>
          <div className="flex items-center gap-3 text-sky-300">
            <ShieldCheck size={22} />

            <span className="text-sm font-semibold uppercase tracking-[0.25em]">
              AFROTC
            </span>
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
            {state.cadet.rank
              ? `${state.cadet.rank} `
              : ""}
            {state.cadet.firstName} {state.cadet.lastName}
          </h1>

          <p className="mt-3 text-white/60">
            {state.cadet.detachment}
          </p>

          <p className="mt-1 text-white/45">
            {state.cadet.flight} • {state.cadet.squadron}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            icon={<Star size={18} />}
            label="Academic Year"
            value={state.cadet.academicYear}
            color="text-cyan-300"
          />

          <MetricCard
            icon={<Users size={18} />}
            label="Semester"
            value={state.cadet.semester}
            color="text-violet-300"
          />

          <MetricCard
            icon={<ShieldCheck size={18} />}
            label="Readiness"
            value={`${state.readinessSummary.score}%`}
            color="text-emerald-300"
          />

          <MetricCard
            icon={<CalendarClock size={18} />}
            label="Next Event"
            value={
              state.nextEvent
                ? formatCountdown(
                    state.nextEvent.start
                  )
                : "None"
            }
            color="text-orange-300"
          />
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <SummaryCard
          title="Status"
          value={state.cadet.status}
        />

        <SummaryCard
          title="Readiness"
          value={`${state.readinessSummary.completed}/${state.readinessSummary.total} Items Ready`}
          badge={readiness.label}
          badgeClass={readiness.className}
        />

        <SummaryCard
          title="Upcoming"
          value={
            state.nextEvent
              ? state.nextEvent.title
              : "No scheduled events"
          }
        />
      </div>
    </motion.section>
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
  badge?: string;
  badgeClass?: string;
}

function SummaryCard({
  title,
  value,
  badge,
  badgeClass,
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
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.15em] text-white/45">
          {title}
        </div>

        {badge && (
          <div
            className={`
              rounded-full
              border
              px-3
              py-1
              text-[11px]
              font-semibold
              uppercase
              tracking-[0.15em]
              ${badgeClass}
            `}
          >
            {badge}
          </div>
        )}
      </div>

      <div className="mt-3 text-lg font-semibold text-white leading-relaxed">
        {value}
      </div>
    </div>
  );
}