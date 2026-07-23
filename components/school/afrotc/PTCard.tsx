"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Clock3,
  Dumbbell,
} from "lucide-react";

import {
  formatCountdown,
  formatEventDate,
  formatEventTime,
} from "./afrotcHelpers";
import { AFROTCState } from "./afrotcTypes";

interface PTCardProps {
  state: AFROTCState;
}

export default function PTCard({
  state,
}: PTCardProps) {
  const nextPT = state.upcomingEvents.find(
    (event) => event.type === "pt"
  );

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 16,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
        rounded-[28px]
        border
        border-white/10
        bg-white/[0.045]
        backdrop-blur-3xl
        p-6
      "
    >
      <div className="flex items-center gap-3">
        <Activity
          size={22}
          className="text-emerald-300"
        />

        <div>
          <h2 className="text-xl font-semibold text-white">
            Physical Training
          </h2>

          <p className="text-sm text-white/55">
            Fitness readiness and upcoming PT.
          </p>
        </div>
      </div>

      <div
        className="
          mt-6
          rounded-2xl
          border
          border-emerald-500/20
          bg-emerald-500/10
          p-5
        "
      >
        <div className="text-xs uppercase tracking-[0.18em] text-emerald-300">
          Next PT Session
        </div>

        {nextPT ? (
          <>
            <div className="mt-2 text-2xl font-bold text-white">
              {nextPT.title}
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/70">
              <span>
                {formatEventDate(nextPT.start)}
              </span>

              <span>
                {formatEventTime(nextPT.start)}
              </span>

              <span>
                {formatCountdown(nextPT.start)}
              </span>
            </div>

            {nextPT.location && (
              <p className="mt-3 text-white/60">
                {nextPT.location}
              </p>
            )}
          </>
        ) : (
          <div className="mt-3 text-white/60">
            No PT sessions scheduled.
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <FitnessMetric
          icon={<Dumbbell size={18} />}
          label="Push-Ups"
          value={state.pt.pushUps}
          goal={state.pt.goalPushUps}
        />

        <FitnessMetric
          icon={<Activity size={18} />}
          label="Sit-Ups"
          value={state.pt.sitUps}
          goal={state.pt.goalSitUps}
        />

        <FitnessMetric
          icon={<Clock3 size={18} />}
          label="1.5 Mile"
          value={state.pt.runTime}
          goal={state.pt.goalRunTime}
          isTime
        />
      </div>
    </motion.section>
  );
}

interface FitnessMetricProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  goal: number | string;
  isTime?: boolean;
}

function FitnessMetric({
  icon,
  label,
  value,
  goal,
  isTime = false,
}: FitnessMetricProps) {
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
      <div className="flex items-center gap-2 text-emerald-300">
        {icon}
      </div>

      <div className="mt-3 text-xs uppercase tracking-[0.15em] text-white/45">
        {label}
      </div>

      <div className="mt-2 text-2xl font-semibold text-white">
        {value}
      </div>

      <div className="mt-1 text-sm text-white/50">
        Goal: {goal}
        {isTime ? "" : ""}
      </div>
    </div>
  );
}