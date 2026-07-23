"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
} from "lucide-react";

import {
  formatDuration,
  getTimelineAppearance,
} from "./timelineHelpers";
import { TimelineEvent } from "./timelineTypes";

interface TimelineItemProps {
  event: TimelineEvent;
  index?: number;
  isLast?: boolean;
}

export default function TimelineItem({
  event,
  index = 0,
  isLast = false,
}: TimelineItemProps) {
  const appearance = getTimelineAppearance(event.type);

  const Icon = appearance.icon;

  const completed = event.status === "completed";
  const current = event.status === "current";

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: -20,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        delay: index * 0.05,
        duration: 0.35,
      }}
      className="relative flex gap-6"
    >
      {/* Timeline Column */}

      <div className="relative flex w-24 shrink-0 flex-col items-center">

        <div className="text-center">
          <p
            className={`text-sm font-semibold ${
              completed
                ? "text-white/45"
                : "text-white"
            }`}
          >
            {event.timeLabel}
          </p>

          <p className="mt-1 text-xs text-white/35">
            {event.dateLabel}
          </p>
        </div>

        <div className="relative mt-5">

          {!isLast && (
            <div
              className={`
                absolute
                left-1/2
                top-12
                -translate-x-1/2
                w-[2px]
                h-[calc(100%+2rem)]
                ${
                  completed
                    ? "bg-emerald-400/30"
                    : "bg-white/15"
                }
              `}
            />
          )}

          {current ? (
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.35, 0, 0.35],
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
              }}
              className={`
                absolute
                inset-0
                rounded-full
                ${appearance.accentClass}
              `}
            />
          ) : null}

          <div
            className={`
              relative
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-full
              border
              bg-neutral-950
              ${
                completed
                  ? "border-emerald-400 text-emerald-300"
                  : appearance.borderClass
              }
            `}
          >
            {completed ? (
              <CheckCircle2 size={20} />
            ) : (
              <Icon
                size={20}
                className={appearance.iconClass}
              />
            )}
          </div>

        </div>

      </div>

      {/* Card */}

      <motion.div
        whileHover={{
          y: -2,
        }}
        className={`
          group
          relative
          mb-5
          flex-1
          overflow-hidden
          rounded-3xl
          border
          backdrop-blur-2xl
          transition-all
          duration-300

          ${
            completed
              ? "border-white/5 bg-white/[0.02] opacity-70"
              : current
              ? `${appearance.borderClass} bg-white/[0.055] shadow-[0_0_30px_rgba(34,211,238,0.08)]`
              : `${appearance.borderClass} bg-white/[0.04]`
          }
        `}
      >
        {/* Accent */}

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

        {/* Hover Glow */}

        {!completed && (
          <div
            className={`
              absolute
              inset-0
              bg-gradient-to-r
              ${appearance.glowClass}
              opacity-0
              transition-opacity
              duration-300
              group-hover:opacity-100
            `}
          />
        )}

        <div className="relative p-5">

          <div className="flex items-start justify-between gap-4">

            <div>

              <h3
                className={`text-xl font-semibold ${
                  completed
                    ? "text-white/60"
                    : "text-white"
                }`}
              >
                {event.title}
              </h3>

              {event.description && (
                <p className="mt-2 text-sm text-white/60">
                  {event.description}
                </p>
              )}

            </div>

            {current && (
              <div className="rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 text-xs font-medium uppercase tracking-wider text-cyan-300">
                Live
              </div>
            )}

          </div>

          <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-white/50">

            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin size={15} />
                {event.location.name}
              </div>
            )}

            {event.durationMinutes && (
              <div className="flex items-center gap-2">
                <Clock3 size={15} />
                {formatDuration(event.durationMinutes)}
              </div>
            )}

          </div>

          {event.aiGenerated && (
            <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                AI Recommendation
              </p>

              <p className="mt-2 text-sm text-white/70">
                This event has been prioritized by Cosmic AI based on
                your workload and schedule.
              </p>
            </div>
          )}

          {event.action && (
            <motion.button
              whileHover={{
                scale: 1.03,
              }}
              whileTap={{
                scale: 0.98,
              }}
              className="
                mt-5
                flex
                items-center
                gap-2
                rounded-2xl
                border
                border-white/10
                bg-white/5
                px-4
                py-2
                text-sm
                text-white
                transition-all
                hover:border-white/20
                hover:bg-white/10
              "
            >
              {event.action.label}

              <ArrowRight size={15} />
            </motion.button>
          )}

        </div>

      </motion.div>

    </motion.div>
  );
}