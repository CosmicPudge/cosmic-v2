"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Percent,
} from "lucide-react";

import {
  formatCompletion,
  formatMinutes,
  getCompletionColor,
  getDeadlineAppearance,
  getDeadlineStatusLabel,
  getTimeRemaining,
} from "./deadlineHelpers";
import { Deadline } from "./deadlineTypes";

interface DeadlineCardProps {
  deadline: Deadline;
  index?: number;
}

export default function DeadlineCard({
  deadline,
  index = 0,
}: DeadlineCardProps) {
  const appearance = getDeadlineAppearance(
    deadline.priority
  );

  const Icon = appearance.icon;

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
      whileHover={{
        y: -4,
      }}
      className={`
        group
        relative
        overflow-hidden
        rounded-3xl
        border
        backdrop-blur-2xl
        transition-all
        duration-300
        ${appearance.borderClass}
        bg-white/[0.04]
      `}
    >
      {/* Hover Glow */}

      <div
        className={`
          absolute
          inset-0
          opacity-0
          transition-opacity
          duration-300
          group-hover:opacity-100
          bg-gradient-to-br
          ${appearance.glowClass}
        `}
      />

      {/* Accent Bar */}

      <div
        className={`
          absolute
          left-0
          top-0
          h-full
          w-1.5
          ${appearance.backgroundClass}
        `}
      />

      <div className="relative p-6">
        {/* Header */}

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen
                size={15}
                className="text-white/45"
              />

              <span className="text-sm text-white/50">
                {deadline.course.code}
              </span>
            </div>

            <h3 className="mt-2 text-xl font-semibold text-white">
              {deadline.title}
            </h3>

            {deadline.description && (
              <p className="mt-2 text-sm text-white/60">
                {deadline.description}
              </p>
            )}
          </div>

          <div
            className={`
              rounded-full
              border
              p-3
              ${appearance.borderClass}
              ${appearance.backgroundClass}
            `}
          >
            <Icon
              size={20}
              className={appearance.colorClass}
            />
          </div>
        </div>

        {/* Status */}

        <div className="mt-6 flex flex-wrap gap-2">
          <div
            className={`
              rounded-full
              px-3
              py-1
              text-xs
              font-medium
              uppercase
              tracking-wider
              ${appearance.backgroundClass}
              ${appearance.colorClass}
            `}
          >
            {getDeadlineStatusLabel(deadline.status)}
          </div>

          <div className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/60">
            {getTimeRemaining(deadline.dueDate)} Remaining
          </div>
        </div>

        {/* Completion */}

        {deadline.completion !== undefined && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs text-white/45">
              <span>Progress</span>

              <span>
                {formatCompletion(deadline.completion)}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{
                  width: 0,
                }}
                animate={{
                  width: `${deadline.completion}%`,
                }}
                transition={{
                  duration: 0.8,
                }}
                className={`
                  h-full
                  rounded-full
                  bg-gradient-to-r
                  ${getCompletionColor(
                    deadline.completion
                  )}
                `}
              />
            </div>
          </div>
        )}

        {/* Metadata */}

        <div className="mt-6 grid gap-3 text-sm text-white/60">
          {deadline.estimatedMinutes && (
            <div className="flex items-center gap-3">
              <Clock3 size={16} />

              {formatMinutes(
                deadline.estimatedMinutes
              )}
            </div>
          )}

          {deadline.gradeWeight && (
            <div className="flex items-center gap-3">
              <Percent size={16} />

              {deadline.gradeWeight}% Course Grade
            </div>
          )}
        </div>

        {/* AI */}

        {deadline.aiInsight && (
          <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Cosmic AI
            </p>

            <p className="mt-2 text-sm leading-relaxed text-white/75">
              {deadline.aiInsight}
            </p>
          </div>
        )}

        {/* Action */}

        {deadline.action && (
          <motion.button
            whileHover={{
              x: 2,
            }}
            className="
              mt-6
              flex
              items-center
              gap-2
              text-sm
              font-medium
              text-cyan-300
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