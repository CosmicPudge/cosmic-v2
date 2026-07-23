"use client";

import { motion } from "framer-motion";

import TimelineCurrent from "./TimelineCurrent";
import TimelineEmpty from "./TimelineEmpty";
import TimelineHeader from "./TimelineHeader";
import TimelineItem from "./TimelineItem";
import { buildTimeline } from "./timelineHelpers";
import { TimelineData } from "./timelineTypes";

interface TimelineCardProps {
  data: TimelineData;
}

export default function TimelineCard({
  data,
}: TimelineCardProps) {
  const timeline = buildTimeline(data);

  const currentDate = new Date().toLocaleDateString(
    undefined,
    {
      weekday: "long",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
      }}
      className="space-y-8"
    >
      <TimelineHeader
        timeline={timeline}
        currentTime={data.currentTime}
        currentDate={currentDate}
      />

      <TimelineCurrent
        currentEvent={timeline.currentEvent}
        nextEvent={timeline.nextEvent}
      />

      {timeline.events.length === 0 ? (
        <TimelineEmpty />
      ) : (
        <div className="space-y-1">
          {timeline.events.map((event, index) => (
            <TimelineItem
              key={event.id}
              event={event}
              index={index}
              isLast={index === timeline.events.length - 1}
            />
          ))}
        </div>
      )}
    </motion.section>
  );
}