"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";

import DeadlineCard from "./DeadlineCard";
import { DeadlinesState, Deadline } from "./deadlineTypes";

interface DeadlineTimelineProps {
  deadlines: DeadlinesState;
}

export default function DeadlineTimeline({
  deadlines,
}: DeadlineTimelineProps) {
  return (
    <div className="space-y-8">
      <DeadlineSection
        title="Overdue"
        icon={<AlertTriangle size={18} />}
        color="text-red-300"
        items={deadlines.overdueDeadlines}
      />

      <DeadlineSection
        title="Due Today"
        icon={<CalendarClock size={18} />}
        color="text-orange-300"
        items={deadlines.dueToday}
      />

      <DeadlineSection
        title="Tomorrow"
        icon={<Calendar size={18} />}
        color="text-cyan-300"
        items={deadlines.dueTomorrow}
      />

      <DeadlineSection
        title="Upcoming"
        icon={<Calendar size={18} />}
        color="text-white/70"
        items={deadlines.upcoming}
      />

      <DeadlineSection
        title="Completed"
        icon={<CheckCircle2 size={18} />}
        color="text-emerald-300"
        items={deadlines.completed}
        completed
      />
    </div>
  );
}

interface DeadlineSectionProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  items: Deadline[];
  completed?: boolean;
}

function DeadlineSection({
  title,
  icon,
  color,
  items,
  completed = false,
}: DeadlineSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={color}>
            {icon}
          </div>

          <h2 className="text-xl font-semibold text-white">
            {title}
          </h2>
        </div>

        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/55">
          {items.length}
        </div>
      </div>

      <motion.div
        layout
        className="grid gap-6 xl:grid-cols-2"
      >
        {items.map((deadline, index) => (
          <motion.div
            key={deadline.id}
            layout
            className={
              completed
                ? "opacity-60"
                : ""
            }
          >
            <DeadlineCard
              deadline={deadline}
              index={index}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}