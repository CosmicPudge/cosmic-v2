"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";

export interface SemesterData {
  name: string;
  week: number;
  progress: number;
}

interface SemesterProgressProps {
  semester: SemesterData;
}

function getSemesterStage(progress: number) {
  if (progress < 15)
    return {
      label: "Early Semester",
      color: "text-emerald-300",
      glow: "from-emerald-500/20 to-emerald-400/5",
    };

  if (progress < 40)
    return {
      label: "Building Momentum",
      color: "text-sky-300",
      glow: "from-sky-500/20 to-cyan-500/5",
    };

  if (progress < 65)
    return {
      label: "Midterm Season",
      color: "text-yellow-300",
      glow: "from-yellow-500/20 to-orange-500/5",
    };

  if (progress < 90)
    return {
      label: "Final Stretch",
      color: "text-orange-300",
      glow: "from-orange-500/20 to-red-500/5",
    };

  return {
    label: "Final Exams",
    color: "text-red-300",
    glow: "from-red-500/20 to-red-400/5",
    };
}

export default function SemesterProgress({
  semester,
}: SemesterProgressProps) {
  const stage = getSemesterStage(semester.progress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="
  relative
  w-full
  min-w-0
  overflow-hidden
  rounded-[32px]
  border
  border-white/10
  bg-white/[0.045]
  p-7
  backdrop-blur-2xl
"
    >
      {/* Ambient Glow */}

      <div
        className={`
          absolute
          inset-0
          bg-gradient-to-br
          ${stage.glow}
          opacity-60
        `}
      />

      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

      <div className="relative z-10">

        {/* Header */}

<div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">

            <div className="flex items-center gap-2 text-white/45">

              <CalendarDays size={15} />

              <span className="text-[11px] uppercase tracking-[0.3em]">
                Semester
              </span>

            </div>

<h3 className="mt-3 break-words text-3xl font-bold tracking-tight text-white">              {semester.name}
            </h3>

            <p className="mt-2 text-lg text-white/60">
              Week {semester.week}
            </p>

          </div>

          <div className="text-right">

            <p className="text-4xl font-bold tracking-tight text-white lg:text-[3.25rem]">
              {semester.progress}
              <span className="ml-1 text-xl text-white/40">
                %
              </span>
            </p>

            <div
              className={`
                mt-3
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-white/10
                bg-white/5
                px-3
                py-1.5
                text-xs
                font-semibold
                backdrop-blur-xl
                ${stage.color}
              `}
            >
              <div className="h-2 w-2 rounded-full bg-current animate-pulse" />

              {stage.label}
            </div>

          </div>

        </div>

        {/* Progress */}

        <div className="mt-6">

          <div className="flex items-center justify-between text-sm text-white/60">

            <span>Semester Progress</span>

            <span>
              {semester.progress}% Complete
            </span>

          </div>

          <div className="relative mt-3 h-4 overflow-hidden rounded-full bg-white/10">

            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width: `${Math.max(
                  semester.progress,
                  3
                )}%`,
              }}
              transition={{
                duration: 1,
                ease: "easeOut",
              }}
              className="
                relative
                h-full
                rounded-full
                bg-gradient-to-r
                from-violet-500
                via-sky-400
                to-cyan-300
              "
            >

              <motion.div
                animate={{
                  opacity: [0.4, 0.9, 0.4],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                }}
                className="
                  absolute
                  right-0
                  top-0
                  h-full
                  w-10
                  rounded-full
                  bg-white/40
                  blur-md
                "
              />

            </motion.div>

          </div>

        </div>

        {/* Stats */}

<div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat
            icon={<CheckCircle2 size={15} />}
            label="Completed"
            value={`${semester.progress}%`}
            footer="of semester"
          />

          <Stat
            icon={<Clock3 size={15} />}
            label="Remaining"
            value={`${100 - semester.progress}%`}
            footer="left"
          />

          <Stat
            icon={<TrendingUp size={15} />}
            label="Week"
            value={semester.week.toString()}
            footer="current"
          />

        </div>

      </div>
    </motion.div>
  );
}

interface StatProps {
  icon: ReactNode;
  label: string;
  value: string;
  footer: string;
}

function Stat({
  icon,
  label,
  value,
  footer,
}: StatProps) {
  return (
    <div
  className="
    min-w-0
    rounded-2xl
    border
    border-white/10
    bg-white/[0.045]
    p-4
    backdrop-blur-xl
    transition-all
    duration-300
    hover:border-white/20
    hover:bg-white/[0.07]
  "
>
      <div className="flex items-center gap-2 text-white/45">

        {icon}

<span className="break-words text-[10px] uppercase tracking-[0.18em] text-white/45">          {label}
        </span>

      </div>

      <p className="mt-2 text-2xl font-bold tracking-tight text-white">
        {value}
      </p>

<p className="mt-1 break-words text-xs text-white/40">        {footer}
      </p>

    </div>
  );
}