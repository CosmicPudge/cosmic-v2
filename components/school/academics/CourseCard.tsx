"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  GraduationCap,
  User,
} from "lucide-react";

import {
  formatPercentage,
  getCourseTrendIcon,
  getGradeProgressColor,
  getLetterColor,
} from "./academicHelpers";
import { Course } from "./academicTypes";

interface CourseCardProps {
  course: Course;
  index?: number;
}

export default function CourseCard({
  course,
  index = 0,
}: CourseCardProps) {
  const TrendIcon = getCourseTrendIcon(course);

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
      transition={{
        delay: index * 0.06,
      }}
      whileHover={{
        y: -4,
      }}
      className="
        group
        relative
        overflow-hidden
        rounded-3xl
        border
        border-white/10
        bg-white/[0.04]
        backdrop-blur-2xl
        transition-all
        duration-300
        hover:border-cyan-500/30
      "
    >
      {/* Hover Glow */}

      <div
        className={`
          absolute
          inset-0
          opacity-0
          transition-opacity
          duration-300
          group-hover:opacity-100
          bg-gradient-to-br
          ${getGradeProgressColor(course.grade.percentage)}
        `}
        style={{
          maskImage:
            "linear-gradient(to bottom, rgba(255,255,255,.12), transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(255,255,255,.12), transparent)",
        }}
      />

      <div className="relative p-6">
        {/* Header */}

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/45">
              {course.code}
            </p>

            <h3 className="mt-1 text-xl font-semibold text-white">
              {course.name}
            </h3>
          </div>

          <div
            className={`rounded-full border border-white/10 bg-white/5 p-3 ${getLetterColor(
              course.grade.letter
            )}`}
          >
            <TrendIcon size={20} />
          </div>
        </div>

        {/* Grade */}

        <div className="mt-6 flex items-end justify-between">
          <div>
            <div
              className={`text-5xl font-bold ${getLetterColor(
                course.grade.letter
              )}`}
            >
              {course.grade.letter}
            </div>

            <div className="mt-1 text-sm text-white/55">
              {formatPercentage(course.grade.percentage)}
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-white/45">
              GPA Points
            </div>

            <div className="text-2xl font-semibold text-white">
              {course.grade.points.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Progress */}

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-white/45">
            <span>Assignments</span>

            <span>
              {course.assignments.completed}/
              {course.assignments.total}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{
                width: 0,
              }}
              animate={{
                width: `${
                  course.assignments.total === 0
                    ? 0
                    : (course.assignments.completed /
                        course.assignments.total) *
                      100
                }%`,
              }}
              transition={{
                duration: 0.9,
              }}
              className={`
                h-full
                rounded-full
                bg-gradient-to-r
                ${getGradeProgressColor(
                  course.grade.percentage
                )}
              `}
            />
          </div>
        </div>

        {/* Details */}

        <div className="mt-6 space-y-3 text-sm">
          {course.instructor && (
            <div className="flex items-center gap-3 text-white/60">
              <User size={16} />

              <span>{course.instructor.name}</span>
            </div>
          )}

          {course.nextAssignment && (
            <div className="flex items-center gap-3 text-white/60">
              <CalendarDays size={16} />

              <span>{course.nextAssignment}</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-white/60">
            <GraduationCap size={16} />

            <span>{course.credits} Credits</span>
          </div>
        </div>

        {/* AI Insight */}

        {course.aiInsight && (
          <div className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              AI Insight
            </p>

            <p className="mt-2 text-sm text-white/75">
              {course.aiInsight}
            </p>
          </div>
        )}

        {/* Action */}

        <motion.button
          whileHover={{
            x: 2,
          }}
          className="
            mt-6
            flex
            items-center
            gap-2
            text-sm
            font-medium
            text-cyan-300
          "
        >
          View Course

          <ArrowRight size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}