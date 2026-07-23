"use client";

import { motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  MapPin,
} from "lucide-react";

import {
  formatCountdown,
  formatEventDate,
  formatEventTime,
} from "./afrotcHelpers";
import type {
  AFROTCEvent,
} from "./afrotcTypes";

interface EventTimelineProps {
  events: AFROTCEvent[];
}

export default function EventTimeline({
  events,
}: EventTimelineProps) {
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
        <CalendarClock
          size={22}
          className="text-cyan-300"
        />

        <div>
          <h2 className="text-xl font-semibold text-white">
            Upcoming Events
          </h2>

          <p className="text-sm text-white/55">
            Your upcoming AFROTC schedule.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {events.length === 0 ? (
          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/[0.03]
              p-6
              text-center
              text-white/60
            "
          >
            No upcoming events.
          </div>
        ) : (
          events.map((event, index) => (
            <TimelineRow
              key={event.id}
              event={event}
              index={index}
            />
          ))
        )}
      </div>
    </motion.section>
  );
}

interface TimelineRowProps {
  event: AFROTCEvent;
  index: number;
}

function TimelineRow({
  event,
  index,
}: TimelineRowProps) {
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
      }}
      className="
        rounded-2xl
        border
        border-white/10
        bg-white/[0.03]
        p-5
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <EventTypeBadge
              type={event.type}
            />

            <h3 className="font-semibold text-white">
              {event.title}
            </h3>
          </div>

          {event.description && (
            <p className="mt-3 text-white/60 leading-relaxed">
              {event.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/55">
            <span>
              {formatEventDate(event.start)}
            </span>

            <span>
              {formatEventTime(event.start)}
            </span>

            <span>
              {formatCountdown(event.start)}
            </span>

            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {event.location}
              </span>
            )}
          </div>
        </div>

        {event.required && (
          <div
            className="
              flex
              items-center
              gap-2
              rounded-full
              border
              border-emerald-500/20
              bg-emerald-500/10
              px-3
              py-1
              text-xs
              font-semibold
              uppercase
              tracking-[0.15em]
              text-emerald-300
            "
          >
            <CheckCircle2 size={14} />
            Required
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface EventTypeBadgeProps {
  type: AFROTCEvent["type"];
}

function EventTypeBadge({
  type,
}: EventTypeBadgeProps) {
  const appearance = {
    llab: "bg-sky-500/15 text-sky-300 border-sky-500/20",
    pt: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    class: "bg-violet-500/15 text-violet-300 border-violet-500/20",
    inspection:
      "bg-amber-500/15 text-amber-300 border-amber-500/20",
    meeting:
      "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
    ceremony:
      "bg-red-500/15 text-red-300 border-red-500/20",
    other:
      "bg-white/10 text-white/70 border-white/10",
  };

  return (
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
        ${appearance[type]}
      `}
    >
      {type}
    </div>
  );
}