"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Clock3,
} from "lucide-react";

import type { PriorityItem as PriorityItemType } from "./priorityTypes";

interface PriorityItemProps {
  priority: PriorityItemType;
}

const LEVEL_STYLES = {
  critical: {
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
    accent: "bg-red-500",
    label: "Critical",
  },
  high: {
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    accent: "bg-orange-500",
    label: "High",
  },
  medium: {
    badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    accent: "bg-yellow-500",
    label: "Medium",
  },
  low: {
    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    accent: "bg-cyan-500",
    label: "Low",
  },
  complete: {
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    accent: "bg-emerald-500",
    label: "Complete",
  },
} as const;

export default function PriorityItem({
  priority,
}: PriorityItemProps) {
  const Icon = priority.icon;

  const level =
    LEVEL_STYLES[priority.level];

  const completed =
    priority.completed ||
    priority.status === "completed";

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      whileHover={{
        y: -2,
      }}
      transition={{
        duration: 0.25,
      }}
      className={`
        relative
        overflow-hidden
        rounded-[26px]
        border
        border-white/10
        bg-white/[0.045]
        backdrop-blur-3xl
        p-6
        transition-all
        duration-300

        ${
          completed
            ? "opacity-70"
            : "hover:border-white/20"
        }
      `}
    >
      <div
        className={`absolute left-0 top-0 h-full w-1 ${level.accent}`}
      />

      <div className="flex items-start justify-between gap-6">
        <div className="flex gap-4">
          <div
            className="rounded-2xl p-3"
            style={{
              backgroundColor: `${priority.color}22`,
              color: priority.color,
            }}
          >
            <Icon size={24} />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h2
                className={`text-lg font-semibold ${
                  completed
                    ? "line-through text-white/45"
                    : "text-white"
                }`}
              >
                {priority.title}
              </h2>

              <span
                className={`
                  rounded-full
                  border
                  px-2.5
                  py-1
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.15em]
                  ${level.badge}
                `}
              >
                {level.label}
              </span>
            </div>

            {priority.subtitle && (
              <p className="mt-2 text-sm text-white/60">
                {priority.subtitle}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/45">
              <div className="flex items-center gap-2">
                <Clock3 size={15} />
                <span>
                  {priority.dueAt
                    ? priority.dueAt.toLocaleString()
                    : "No due date"}
                </span>
              </div>

              <span>
                Score {priority.score}
              </span>

              <span className="capitalize">
                {priority.source}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          {completed ? (
            <CheckCircle2
              size={28}
              className="text-emerald-400"
            />
          ) : (
            <Circle
              size={26}
              className="text-white/25"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}