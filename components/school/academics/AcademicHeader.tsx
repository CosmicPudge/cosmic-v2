"use client";

import { motion } from "framer-motion";
import {
  Award,
  CalendarDays,
  GraduationCap,
  Sparkles,
} from "lucide-react";

import {
  AcademicsState,
} from "./academicTypes";
import {
  formatGPA,
  formatPercentage,
} from "./academicHelpers";

interface AcademicHeaderProps {
  academics: AcademicsState;
}

export default function AcademicHeader({
  academics,
}: AcademicHeaderProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
        rounded-[32px]
        border
        border-white/10
        bg-white/[0.045]
        backdrop-blur-3xl
        p-8
      "
    >
      <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
        {/* Left */}

        <div>
          <div className="flex items-center gap-3 text-cyan-300">
            <GraduationCap size={22} />

            <span className="text-sm font-semibold uppercase tracking-[0.25em]">
              Academics
            </span>
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
            Semester Overview
          </h1>

          <p className="mt-3 max-w-2xl text-white/60 leading-relaxed">
            Monitor your academic performance, stay on top of
            coursework, and let Cosmic identify opportunities to
            improve your semester before small issues become larger
            ones.
          </p>
        </div>

        {/* Right */}

        <div className="grid gap-4 sm:grid-cols-2">
          <QuickMetric
            icon={<Award size={18} />}
            label="Semester GPA"
            value={formatGPA(academics.semester.gpa)}
          />

          <QuickMetric
            icon={<CalendarDays size={18} />}
            label="Average"
            value={formatPercentage(
              academics.averageGrade
            )}
          />

          <QuickMetric
            icon={<GraduationCap size={18} />}
            label="Credits"
            value={`${academics.semester.creditsCompleted}/${academics.semester.creditsTotal}`}
          />

          <QuickMetric
            icon={<Sparkles size={18} />}
            label="AI Status"
            value={
              academics.lowestCourse
                ? `Watching ${academics.lowestCourse.code}`
                : "All Courses Healthy"
            }
          />
        </div>
      </div>

      {/* Footer Summary */}

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <SummaryCard
          title="Top Performing Course"
          value={
            academics.highestCourse
              ? `${academics.highestCourse.code} • ${academics.highestCourse.grade.letter}`
              : "—"
          }
        />

        <SummaryCard
          title="Needs Attention"
          value={
            academics.lowestCourse
              ? `${academics.lowestCourse.code} • ${academics.lowestCourse.grade.letter}`
              : "None"
          }
        />

        <SummaryCard
          title="Assignment Completion"
          value={formatPercentage(
            academics.assignmentCompletion
          )}
        />
      </div>
    </motion.div>
  );
}

interface QuickMetricProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function QuickMetric({
  icon,
  label,
  value,
}: QuickMetricProps) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-white/[0.03]
        p-4
      "
    >
      <div className="flex items-center gap-2 text-cyan-300">
        {icon}
      </div>

      <div className="mt-3 text-xs uppercase tracking-[0.15em] text-white/45">
        {label}
      </div>

      <div className="mt-1 text-xl font-semibold text-white">
        {value}
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
}

function SummaryCard({
  title,
  value,
}: SummaryCardProps) {
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
      <div className="text-xs uppercase tracking-[0.15em] text-white/45">
        {title}
      </div>

      <div className="mt-2 text-lg font-semibold text-white">
        {value}
      </div>
    </div>
  );
}