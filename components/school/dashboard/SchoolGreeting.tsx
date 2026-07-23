"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Clock3,
  MapPin,
  Sun,
} from "lucide-react";

import type {
  DashboardGreeting,
  DashboardOverview,
} from "./dashboardTypes";

interface SchoolGreetingProps {
  greeting: DashboardGreeting;
  overview: DashboardOverview;
}

export default function SchoolGreeting({
  greeting,
  overview,
}: SchoolGreetingProps) {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: -20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
      }}
      className="
        relative
        overflow-hidden
        rounded-[36px]
        border
        border-white/10
        bg-white/[0.045]
        p-8
        backdrop-blur-3xl
      "
    >
      <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">
            <Sun size={16} />
            School Dashboard
          </div>

          <div>
            <h1 className="text-5xl font-bold tracking-tight text-white">
              {greeting.title}
            </h1>

            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white/65">
              {greeting.subtitle}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoCard
            icon={<MapPin size={18} />}
            title="Location"
            value={overview.location}
          />

          <InfoCard
            icon={<Sun size={18} />}
            title="Weather"
            value={`${overview.temperature}° • ${overview.condition}`}
          />

          <InfoCard
            icon={<Clock3 size={18} />}
            title="Next Class"
            value={
              overview.nextClass
                ? `${overview.nextClass} • ${overview.nextClassTime}`
                : "No upcoming classes"
            }
          />

          <InfoCard
            icon={<BookOpen size={18} />}
            title="Today's Classes"
            value={`${overview.todaysClasses}`}
          />
        </div>
      </div>
    </motion.section>
  );
}

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
}

function InfoCard({
  icon,
  title,
  value,
}: InfoCardProps) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-white/[0.03]
        p-5
      "
    >
      <div className="flex items-center gap-2 text-cyan-300">
        {icon}

        <span className="text-xs font-semibold uppercase tracking-[0.15em]">
          {title}
        </span>
      </div>

      <div className="mt-3 text-lg font-semibold text-white">
        {value}
      </div>
    </div>
  );
}