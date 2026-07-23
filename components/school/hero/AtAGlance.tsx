"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Plane,
} from "lucide-react";
import type { ReactNode } from "react";

export interface AtAGlanceProps {
  classesToday: number;
  assignmentsDue: number;
  afrotcEvents: number;
  gpa: number;
}

export default function AtAGlance({
  classesToday,
  assignmentsDue,
  afrotcEvents,
  gpa,
}: AtAGlanceProps) {
  return (
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
      <QuickStat
        delay={0}
        icon={<BookOpen size={22} />}
        title="Classes"
        value={classesToday.toString()}
        subtitle={
          classesToday === 0
            ? "No classes today"
            : `${classesToday} scheduled`
        }
        accent="blue"
      />

      <QuickStat
        delay={0.08}
        icon={<ClipboardCheck size={22} />}
        title="Assignments"
        value={assignmentsDue.toString()}
        subtitle={
          assignmentsDue === 0
            ? "Everything caught up"
            : `${assignmentsDue} due`
        }
        accent="amber"
      />

      <QuickStat
        delay={0.16}
        icon={<Plane size={22} />}
        title="AFROTC"
        value={afrotcEvents.toString()}
        subtitle={
          afrotcEvents === 0
            ? "Nothing scheduled"
            : `${afrotcEvents} event${afrotcEvents === 1 ? "" : "s"}`
        }
        accent="cyan"
      />

      <QuickStat
        delay={0.24}
        icon={<GraduationCap size={22} />}
        title="GPA"
        value={gpa.toFixed(2)}
        subtitle={academicStanding(gpa)}
        accent="violet"
      />
    </div>
  );
}

interface QuickStatProps {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle: string;
  accent: "blue" | "amber" | "cyan" | "violet";
  delay: number;
}

function QuickStat({
  icon,
  title,
  value,
  subtitle,
  accent,
  delay,
}: QuickStatProps) {
  const accents = {
    blue: "from-sky-500/20 to-blue-500/5 text-sky-300",
    amber: "from-amber-500/20 to-orange-500/5 text-amber-300",
    cyan: "from-cyan-500/20 to-teal-500/5 text-cyan-300",
    violet: "from-violet-500/20 to-fuchsia-500/5 text-violet-300",
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
        delay,
      }}
      className="
        group
        relative
        overflow-hidden
        rounded-3xl
        border
        border-white/10
        bg-white/[0.045]
        backdrop-blur-2xl
        p-6
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-white/20
        hover:bg-white/[0.07]
      "
    >
      <div
        className={`
          absolute
          inset-0
          bg-gradient-to-br
          opacity-60
          ${accents[accent]}
        `}
      />

      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-white/5 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-3">

          <div
            className={`
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-2xl
              bg-white/10
              ${accents[accent].split(" ").pop()}
            `}
          >
            {icon}
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              {title}
            </p>

            <p className="mt-1 text-3xl font-bold tracking-tight text-white">
              {value}
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-white/60">
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
}

function academicStanding(gpa: number) {
  if (gpa >= 3.8) return "Excellent standing";
  if (gpa >= 3.5) return "Strong performance";
  if (gpa >= 3.0) return "On track";
  if (gpa >= 2.5) return "Needs improvement";
  return "Academic warning";
}