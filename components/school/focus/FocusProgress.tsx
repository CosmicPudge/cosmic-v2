"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  Target,
} from "lucide-react";

import { DailyProgress } from "./focusTypes";

interface FocusProgressProps {
  progress: DailyProgress;
}

export default function FocusProgress({
  progress,
}: FocusProgressProps) {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
      }}
      className="
        relative
        overflow-hidden
        rounded-[28px]
        border
        border-white/10
        bg-white/[0.045]
        p-7
        backdrop-blur-2xl
      "
    >
      {/* Ambient Glow */}

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-br
          from-emerald-500/10
          via-transparent
          to-transparent
        "
      />

      <div className="relative z-10">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-xs uppercase tracking-[0.3em] text-white/45">
              Daily Progress
            </p>

            <h3 className="mt-2 text-2xl font-bold text-white">
              Today's Momentum
            </h3>

          </div>

          <div className="text-right">

            <p className="text-3xl font-bold text-white">
              {progress.completionPercent}%
            </p>

            <p className="text-sm text-white/50">
              Complete
            </p>

          </div>

        </div>

        {/* Progress Bar */}

        <div className="mt-8">

          <div className="mb-3 flex justify-between text-sm text-white/60">

            <span>Overall Progress</span>

            <span>
              {progress.completionPercent}%
            </span>

          </div>

          <div className="h-3 overflow-hidden rounded-full bg-white/10">

            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width: `${progress.completionPercent}%`,
              }}
              transition={{
                duration: 0.8,
              }}
              className="
                h-full
                rounded-full
                bg-gradient-to-r
                from-emerald-400
                to-cyan-400
              "
            />

          </div>

        </div>

        {/* Stats */}

        <div className="mt-8 grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <div className="flex items-center gap-3">

              <CheckCircle2
                className="text-emerald-300"
                size={20}
              />

              <div>

                <p className="text-sm text-white/50">
                  Tasks
                </p>

                <p className="mt-1 text-xl font-bold text-white">
                  {progress.completedTasks}/
                  {progress.totalTasks}
                </p>

              </div>

            </div>

          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <div className="flex items-center gap-3">

              <Clock3
                className="text-sky-300"
                size={20}
              />

              <div>

                <p className="text-sm text-white/50">
                  Study Time
                </p>

                <p className="mt-1 text-xl font-bold text-white">
                  {progress.completedMinutes}m
                </p>

              </div>

            </div>

          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">

            <div className="flex items-center gap-3">

              <Target
                className="text-purple-300"
                size={20}
              />

              <div>

                <p className="text-sm text-white/50">
                  Goal
                </p>

                <p className="mt-1 text-xl font-bold text-white">
                  {progress.targetMinutes}m
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>
    </motion.section>
  );
}