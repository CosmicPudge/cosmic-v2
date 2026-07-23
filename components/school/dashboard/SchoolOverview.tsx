"use client";

import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flag,
} from "lucide-react";

import type { DashboardOverview } from "./dashboardTypes";

interface SchoolOverviewProps {
  overview: DashboardOverview;
}

export default function SchoolOverview({
  overview,
}: SchoolOverviewProps) {
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
      transition={{
        delay: 0.15,
      }}
      className="
        grid
        gap-6
        md:grid-cols-2
        xl:grid-cols-4
      "
    >
      <OverviewCard
        icon={CalendarDays}
        title="Today's Classes"
        value={overview.todaysClasses.toString()}
        subtitle="Scheduled"
        color="#3B82F6"
      />

      <OverviewCard
        icon={BookOpen}
        title="Next Class"
        value={overview.nextClass ?? "None"}
        subtitle={
          overview.nextClassTime ??
          "No upcoming classes"
        }
        color="#A855F7"
      />

      <OverviewCard
        icon={Award}
        title="Weather"
        value={`${overview.temperature}°`}
        subtitle={overview.condition}
        color="#06B6D4"
      />

      <OverviewCard
        icon={Flag}
        title="Location"
        value={overview.location}
        subtitle="Current Campus"
        color="#22C55E"
      />
    </motion.section>
  );
}

interface OverviewCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}

function OverviewCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
}: OverviewCardProps) {
  return (
    <motion.div
      whileHover={{
        y: -3,
      }}
      transition={{
        duration: 0.2,
      }}
      className="
        rounded-[28px]
        border
        border-white/10
        bg-white/[0.045]
        p-6
        backdrop-blur-3xl
      "
    >
      <div
        className="inline-flex rounded-2xl p-3"
        style={{
          backgroundColor: `${color}22`,
          color,
        }}
      >
        <Icon size={24} />
      </div>

      <div className="mt-6">
        <p className="text-xs uppercase tracking-[0.15em] text-white/45">
          {title}
        </p>

        <h3 className="mt-2 text-3xl font-bold text-white">
          {value}
        </h3>

        <p className="mt-2 text-sm text-white/60">
          {subtitle}
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2 text-white/35">
        <Clock3 size={15} />

        <span className="text-xs">
          Updated just now
        </span>

        <div className="ml-auto">
          <CheckCircle2
            size={16}
            className="text-emerald-400"
          />
        </div>
      </div>
    </motion.div>
  );
}