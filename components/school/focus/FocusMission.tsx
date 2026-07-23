"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import {
  formatMinutes,
  getPriorityAppearance,
} from "./focusHelpers";
import { FocusMission as FocusMissionData } from "./focusTypes";

interface FocusMissionProps {
  mission: FocusMissionData;
}

export default function FocusMission({
  mission,
}: FocusMissionProps) {
  const appearance = getPriorityAppearance(
    mission.priority
  );

  const Icon = appearance.icon;

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
      whileHover={{
        y: -2,
      }}
      className={`
        group
        relative
        overflow-hidden
        rounded-[28px]
        border
        bg-white/[0.045]
        backdrop-blur-2xl
        transition-all
        duration-300
        ${appearance.borderClass}
      `}
    >
      {/* Left Accent */}

      <div
        className={`
          absolute
          left-0
          top-0
          h-full
          w-1.5
          ${appearance.accentClass}
        `}
      />

      {/* Glow */}

      <div
        className={`
          absolute
          inset-0
          bg-gradient-to-br
          ${appearance.glowClass}
          opacity-70
        `}
      />

      <div className="relative z-10 p-7">

        {/* Header */}

        <div className="flex items-center gap-4">

          <div
            className={`
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-white/5
              ${appearance.iconClass}
            `}
          >
            <Icon size={24} />
          </div>

          <div>

            <p className="text-xs uppercase tracking-[0.25em] text-white/45">
              Today's Mission
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">
              {mission.title}
            </h2>

          </div>

        </div>

        {/* Subtitle */}

        <p className="mt-6 text-lg text-white/75">
          {mission.subtitle}
        </p>

        {/* Description */}

        {mission.description && (
          <p className="mt-3 max-w-2xl leading-relaxed text-white/55">
            {mission.description}
          </p>
        )}

        {/* Progress */}

        <div className="mt-8">

          <div className="mb-2 flex items-center justify-between text-sm">

            <span className="text-white/60">
              Progress
            </span>

            <span className="font-semibold text-white">
              {mission.progress}%
            </span>

          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/10">

            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width: `${mission.progress}%`,
              }}
              transition={{
                duration: 0.8,
              }}
              className={`
                h-full
                rounded-full
                ${appearance.accentClass}
              `}
            />

          </div>

        </div>

        {/* Footer */}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">

          <div className="flex gap-6 text-sm text-white/55">

            <div>
              <p className="text-white/40">
                Estimated Time
              </p>

              <p className="mt-1 font-medium text-white">
                {formatMinutes(
                  mission.estimatedMinutes
                )}
              </p>
            </div>

            <div>
              <p className="text-white/40">
                Due
              </p>

              <p className="mt-1 font-medium text-white">
                {mission.dueText}
              </p>
            </div>

          </div>

          {mission.action && (
            <motion.button
              whileHover={{
                scale: 1.03,
              }}
              whileTap={{
                scale: 0.98,
              }}
              className="
                flex
                items-center
                gap-2
                rounded-2xl
                border
                border-white/10
                bg-white/5
                px-5
                py-3
                text-sm
                font-medium
                text-white
                transition-all
                hover:border-white/20
                hover:bg-white/10
              "
            >
              {mission.action.label}

              <ArrowRight size={16} />
            </motion.button>
          )}

        </div>

      </div>
    </motion.section>
  );
}