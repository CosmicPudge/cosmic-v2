"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Clock3,
  Percent,
  Sparkles,
} from "lucide-react";

import {
  formatMinutes,
  getDeadlineAppearance,
  getTimeRemaining,
} from "./deadlineHelpers";
import { Deadline } from "./deadlineTypes";

interface UrgentDeadlineProps {
  deadline?: Deadline;
}

export default function UrgentDeadline({
  deadline,
}: UrgentDeadlineProps) {
  if (!deadline) {
    return (
      <div
        className="
          rounded-[32px]
          border
          border-white/10
          bg-white/[0.04]
          backdrop-blur-3xl
          p-8
          text-center
        "
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
          <Sparkles className="text-emerald-300" size={28} />
        </div>

        <h2 className="mt-5 text-2xl font-semibold text-white">
          You're All Caught Up
        </h2>

        <p className="mt-3 max-w-xl mx-auto text-white/60 leading-relaxed">
          There aren't any urgent assignments right now. Enjoy the
          extra time or get ahead on upcoming work.
        </p>
      </div>
    );
  }

  const appearance = getDeadlineAppearance(deadline.priority);

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
      className={`
        relative
        overflow-hidden
        rounded-[32px]
        border
        backdrop-blur-3xl
        p-8
        ${appearance.borderClass}
        bg-white/[0.05]
      `}
    >
      {/* Background Glow */}

      <div
        className={`
          absolute
          inset-0
          bg-gradient-to-br
          ${appearance.glowClass}
          opacity-60
        `}
      />

      {/* Pulse */}

      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.2, 0.45, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
        }}
        className="
          absolute
          -right-20
          -top-20
          h-72
          w-72
          rounded-full
          bg-red-500/10
          blur-3xl
        "
      />

      <div className="relative">
        {/* Badge */}

        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2">
          <AlertTriangle
            size={16}
            className="text-red-300"
          />

          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
            Highest Priority
          </span>
        </div>

        {/* Title */}

        <h2 className="mt-6 text-4xl font-bold tracking-tight text-white">
          {deadline.title}
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-white/65">
          <div className="flex items-center gap-2">
            <BookOpen size={16} />

            {deadline.course.code}
          </div>

          <div>
            {getTimeRemaining(deadline.dueDate)} Remaining
          </div>
        </div>

        {deadline.description && (
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/70">
            {deadline.description}
          </p>
        )}

        {/* Stats */}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard
            icon={<Clock3 size={18} />}
            label="Estimated Time"
            value={formatMinutes(
              deadline.estimatedMinutes
            )}
          />

          <StatCard
            icon={<Percent size={18} />}
            label="Grade Weight"
            value={
              deadline.gradeWeight
                ? `${deadline.gradeWeight}%`
                : "—"
            }
          />

          <StatCard
            icon={<Sparkles size={18} />}
            label="Priority"
            value={deadline.priority.toUpperCase()}
          />
        </div>

        {/* AI */}

        {deadline.aiInsight && (
          <div className="mt-8 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Cosmic AI Recommendation
            </div>

            <p className="mt-3 text-white/75 leading-relaxed">
              {deadline.aiInsight}
            </p>
          </div>
        )}

        {/* Action */}

        {deadline.action && (
          <motion.button
            whileHover={{
              x: 3,
            }}
            whileTap={{
              scale: 0.98,
            }}
            className="
              mt-8
              flex
              items-center
              gap-2
              rounded-2xl
              border
              border-white/10
              bg-white/5
              px-5
              py-3
              text-white
              transition-all
              hover:border-white/20
              hover:bg-white/10
            "
          >
            {deadline.action.label}

            <ArrowRight size={16} />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({
  icon,
  label,
  value,
}: StatCardProps) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-white/[0.04]
        p-5
      "
    >
      <div className="flex items-center gap-2 text-cyan-300">
        {icon}
      </div>

      <div className="mt-3 text-xs uppercase tracking-[0.15em] text-white/45">
        {label}
      </div>

      <div className="mt-2 text-xl font-semibold text-white">
        {value}
      </div>
    </div>
  );
}