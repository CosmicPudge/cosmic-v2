"use client";

import { motion } from "framer-motion";
import { Brain, Flame } from "lucide-react";

import type {
  PriorityRecommendation,
  PrioritySummary,
} from "./priorityTypes";

interface PriorityHeaderProps {
  summary: PrioritySummary;
  recommendation?: PriorityRecommendation;
}

export default function PriorityHeader({
  summary,
  recommendation,
}: PriorityHeaderProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{
          opacity: 0,
          y: -16,
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
          p-8
          backdrop-blur-3xl
        "
      >
        <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3 text-orange-300">
              <Flame size={22} />

              <span className="text-sm font-semibold uppercase tracking-[0.25em]">
                Priority Engine
              </span>
            </div>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
              Today's Priorities
            </h1>

            <p className="mt-3 max-w-3xl text-white/60 leading-relaxed">
              Focus on what matters most first. Your highest-impact
              tasks are automatically surfaced here.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-5">
            <SummaryCard
              label="Critical"
              value={summary.critical}
              color="text-red-400"
            />

            <SummaryCard
              label="High"
              value={summary.high}
              color="text-orange-300"
            />

            <SummaryCard
              label="Medium"
              value={summary.medium}
              color="text-yellow-300"
            />

            <SummaryCard
              label="Low"
              value={summary.low}
              color="text-cyan-300"
            />

            <SummaryCard
              label="Done"
              value={summary.completed}
              color="text-emerald-300"
            />
          </div>
        </div>
      </motion.div>

      {recommendation && (
        <motion.div
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.15,
          }}
          className="
            rounded-[28px]
            border
            border-cyan-400/20
            bg-cyan-500/10
            p-6
            backdrop-blur-3xl
          "
        >
          <div className="flex items-start gap-4">
            <div
              className="
                rounded-2xl
                bg-cyan-500/15
                p-3
                text-cyan-300
              "
            >
              <Brain size={24} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                AI Recommendation
              </h2>

              <h3 className="mt-2 text-base font-medium text-cyan-200">
                {recommendation.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {recommendation.description}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  color: string;
}

function SummaryCard({
  label,
  value,
  color,
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
        {label}
      </div>

      <div className={`mt-2 text-3xl font-bold ${color}`}>
        {value}
      </div>
    </div>
  );
}