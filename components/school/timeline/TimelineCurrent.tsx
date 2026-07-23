"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  Clock3,
  MapPin,
  Sparkles,
} from "lucide-react";

import {
  formatDuration,
  getTimelineAppearance,
} from "./timelineHelpers";
import { TimelineEvent } from "./timelineTypes";

interface TimelineCurrentProps {
  currentEvent?: TimelineEvent;
  nextEvent?: TimelineEvent;
}

export default function TimelineCurrent({
  currentEvent,
  nextEvent,
}: TimelineCurrentProps) {
  if (!currentEvent) {
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
        className="
          relative
          overflow-hidden
          rounded-[30px]
          border
          border-white/10
          bg-white/[0.045]
          backdrop-blur-2xl
        "
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent" />

        <div className="relative p-8">
          <div className="flex items-center gap-2 text-cyan-300">
            <CalendarClock size={18} />

            <span className="text-xs font-semibold uppercase tracking-[0.3em]">
              Now
            </span>
          </div>

          <h2 className="mt-5 text-3xl font-bold text-white">
            You're Free Right Now
          </h2>

          {nextEvent ? (
            <>
              <p className="mt-3 max-w-xl text-white/60">
                Your next scheduled event is{" "}
                <span className="font-medium text-white">
                  {nextEvent.title}
                </span>
                .
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/55">
                <div className="flex items-center gap-2">
                  <Clock3 size={16} />

                  <span>{nextEvent.timeLabel}</span>
                </div>

                {nextEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />

                    <span>{nextEvent.location.name}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="mt-3 text-white/60">
              Your schedule is complete for today.
            </p>
          )}
        </div>
      </motion.section>
    );
  }

  const appearance = getTimelineAppearance(currentEvent.type);
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
      className={`
        relative
        overflow-hidden
        rounded-[30px]
        border
        bg-white/[0.05]
        backdrop-blur-2xl
        ${appearance.borderClass}
      `}
    >
      {/* Glow */}

      <div
        className={`
          absolute
          inset-0
          bg-gradient-to-br
          ${appearance.glowClass}
        `}
      />

      {/* Pulse */}

      <motion.div
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.35, 0, 0.35],
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
        }}
        className={`
          absolute
          right-8
          top-8
          h-5
          w-5
          rounded-full
          ${appearance.accentClass}
        `}
      />

      <div className="relative p-8">

        {/* Header */}

        <div className="flex items-center gap-2 text-cyan-300">
          <Sparkles size={18} />

          <span className="text-xs font-semibold uppercase tracking-[0.3em]">
            Happening Now
          </span>
        </div>

        <div className="mt-6 flex items-start justify-between gap-6">

          <div className="flex-1">

            <div className="flex items-center gap-4">

              <div
                className={`
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  bg-white/5
                  ${appearance.borderClass}
                `}
              >
                <Icon
                  className={appearance.iconClass}
                  size={30}
                />
              </div>

              <div>
                <h2 className="text-3xl font-bold text-white">
                  {currentEvent.title}
                </h2>

                {currentEvent.description && (
                  <p className="mt-2 text-white/60">
                    {currentEvent.description}
                  </p>
                )}
              </div>

            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/55">

              <div className="flex items-center gap-2">
                <Clock3 size={16} />

                <span>
                  {currentEvent.timeLabel}
                </span>
              </div>

              {currentEvent.durationMinutes && (
                <div className="flex items-center gap-2">
                  <Clock3 size={16} />

                  <span>
                    {formatDuration(
                      currentEvent.durationMinutes
                    )}
                  </span>
                </div>
              )}

              {currentEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} />

                  <span>
                    {currentEvent.location.name}
                  </span>
                </div>
              )}

            </div>

          </div>

          {currentEvent.action && (
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
                text-white
                transition-all
                hover:border-white/20
                hover:bg-white/10
              "
            >
              {currentEvent.action.label}

              <ArrowRight size={16} />
            </motion.button>
          )}

        </div>

      </div>
    </motion.section>
  );
}