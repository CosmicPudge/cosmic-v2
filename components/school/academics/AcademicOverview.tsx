"use client";

import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";

import GradeRing from "./GradeRing";
import {
  buildAcademics,
  formatGPA,
  formatPercentage,
  getStandingAppearance,
} from "./academicHelpers";
import { AcademicsData } from "./academicTypes";

interface AcademicOverviewProps {
  data: AcademicsData;
}

export default function AcademicOverview({
  data,
}: AcademicOverviewProps) {
  const academics = buildAcademics(data);

  const standing = getStandingAppearance(
    academics.semester.standing
  );

  const StandingIcon = standing.icon;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
        rounded-[32px]
        border
        border-white/10
        bg-white/[0.04]
        backdrop-blur-3xl
        p-8
      "
    >
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        {/* Grade Ring */}

        <div className="flex justify-center">
          <GradeRing
            value={academics.averageGrade}
            label="Semester Average"
            sublabel={`${formatGPA(
              academics.semester.gpa
            )} GPA`}
          />
        </div>

        {/* Content */}

        <div className="space-y-8">
          {/* Stats */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Award size={20} />}
              label="Semester GPA"
              value={formatGPA(
                academics.semester.gpa
              )}
            />

            <StatCard
              icon={<BookOpen size={20} />}
              label="Average"
              value={formatPercentage(
                academics.averageGrade
              )}
            />

            <StatCard
              icon={<GraduationCap size={20} />}
              label="Credits"
              value={`${academics.semester.creditsCompleted}/${academics.semester.creditsTotal}`}
            />

            <StatCard
              icon={<CheckCircle2 size={20} />}
              label="Assignments"
              value={formatPercentage(
                academics.assignmentCompletion
              )}
            />
          </div>

          {/* Standing */}

          <div
            className={`
              rounded-3xl
              border
              p-5
              ${standing.borderClass}
              ${standing.backgroundClass}
            `}
          >
            <div className="flex items-center gap-4">
              <div
                className={`
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/5
                  p-3
                  ${standing.colorClass}
                `}
              >
                <StandingIcon size={22} />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">
                  Current Standing
                </h3>

                <p className="mt-1 text-white/65 capitalize">
                  {academics.semester.standing}
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs uppercase tracking-[0.2em] text-white/40">
                  Scholarship
                </div>

                <div className="mt-1 font-medium text-white">
                  {academics.semester
                    .scholarshipEligible
                    ? "Eligible"
                    : "Review Needed"}
                </div>
              </div>
            </div>
          </div>

          {/* AI Summary */}

          {academics.semester.aiSummary && (
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                delay: 0.35,
              }}
              className="
                rounded-3xl
                border
                border-cyan-500/20
                bg-cyan-500/10
                p-5
              "
            >
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Cosmic AI Insight
              </div>

              <p className="mt-3 text-white/75 leading-relaxed">
                {academics.semester.aiSummary}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({
  icon,
  label,
  value,
}: StatCardProps) {
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
      <div className="flex items-center gap-3 text-cyan-300">
        {icon}
      </div>

      <div className="mt-4 text-xs uppercase tracking-[0.15em] text-white/45">
        {label}
      </div>

      <div className="mt-2 text-2xl font-semibold text-white">
        {value}
      </div>
    </div>
  );
}