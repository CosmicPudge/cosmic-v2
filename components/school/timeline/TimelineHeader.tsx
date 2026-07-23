"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ListTodo,
} from "lucide-react";

import { formatDuration } from "./timelineHelpers";
import { TimelineState } from "./timelineTypes";

interface TimelineHeaderProps {
  timeline: TimelineState;
  currentTime: string;
  currentDate: string;
}

export default function TimelineHeader({
  timeline,
  currentTime,
  currentDate,
}: TimelineHeaderProps) {
  return (
    <div className="flex flex-col gap-8">

      {/* Top */}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

        <div>

          <div className="flex items-center gap-2 text-white/45">
            <CalendarDays size={16} />

            <span className="text-[11px] font-medium uppercase tracking-[0.3em]">
              Daily Timeline
            </span>
          </div>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
            Today's Schedule
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/55">

            <span>{currentDate}</span>

            <span>•</span>

            <span>{currentTime}</span>

          </div>

        </div>

        <motion.div
          whileHover={{
            scale: 1.02,
          }}
          transition={{
            duration: 0.2,
          }}
          className="
            rounded-3xl
            border
            border-cyan-500/20
            bg-cyan-500/10
            px-6
            py-5
            backdrop-blur-xl
          "
        >
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
            Next Event
          </p>

          {timeline.nextEvent ? (
            <>
              <h3 className="mt-2 text-xl font-semibold text-white">
                {timeline.nextEvent.title}
              </h3>

              <p className="mt-1 text-sm text-white/60">
                {timeline.nextEvent.timeLabel}
              </p>
            </>
          ) : (
            <p className="mt-2 text-white/60">
              Nothing else scheduled today.
            </p>
          )}
        </motion.div>

      </div>

      {/* Dashboard Stats */}

      <div className="grid gap-4 md:grid-cols-4">

        <motion.div
          whileHover={{ y: -2 }}
          className="
            rounded-2xl
            border
            border-white/10
            bg-white/[0.045]
            p-5
            backdrop-blur-xl
          "
        >
          <div className="flex items-center gap-2 text-sky-300">
            <ListTodo size={18} />
            <span className="text-xs uppercase tracking-[0.2em]">
              Remaining
            </span>
          </div>

          <p className="mt-4 text-3xl font-bold text-white">
            {timeline.remainingCount}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="
            rounded-2xl
            border
            border-white/10
            bg-white/[0.045]
            p-5
            backdrop-blur-xl
          "
        >
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 size={18} />
            <span className="text-xs uppercase tracking-[0.2em]">
              Completed
            </span>
          </div>

          <p className="mt-4 text-3xl font-bold text-white">
            {timeline.completedCount}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="
            rounded-2xl
            border
            border-white/10
            bg-white/[0.045]
            p-5
            backdrop-blur-xl
          "
        >
          <div className="flex items-center gap-2 text-amber-300">
            <Clock3 size={18} />
            <span className="text-xs uppercase tracking-[0.2em]">
              Scheduled
            </span>
          </div>

          <p className="mt-4 text-2xl font-bold text-white">
            {formatDuration(timeline.scheduledMinutes)}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="
            rounded-2xl
            border
            border-white/10
            bg-white/[0.045]
            p-5
            backdrop-blur-xl
          "
        >
          <div className="flex items-center justify-between">

            <span className="text-xs uppercase tracking-[0.2em] text-violet-300">
              Day Progress
            </span>

            <span className="text-sm font-semibold text-white">
              {timeline.progress}%
            </span>

          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">

            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width: `${timeline.progress}%`,
              }}
              transition={{
                duration: 0.8,
              }}
              className="
                h-full
                rounded-full
                bg-gradient-to-r
                from-violet-500
                to-cyan-400
              "
            />

          </div>

        </motion.div>

      </div>

    </div>
  );
}