"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock3,
  Sparkles,
} from "lucide-react";

import {
  formatConfidence,
  getPriorityAppearance,
} from "./coachHelpers";
import { CoachState } from "./coachTypes";

interface CoachRecommendationProps {
  coach: CoachState;
}

export default function CoachRecommendation({
  coach,
}: CoachRecommendationProps) {
  const task = coach.nextTask;

  if (!task) {
    return (
      <div
        className="
          rounded-[32px]
          border
          border-white/10
          bg-white/[0.04]
          backdrop-blur-3xl
          p-8
          text-center
        "
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
          <CheckCircle2
            size={30}
            className="text-emerald-300"
          />
        </div>

        <h2 className="mt-5 text-3xl font-bold text-white">
          You're Finished for Today
        </h2>

        <p className="mt-3 text-white/60">
          Nice work. Cosmic doesn't see anything
          requiring your attention right now.
        </p>
      </div>
    );
  }

  const appearance = getPriorityAppearance(
    task.priority
  );

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
      className={`
        relative
        overflow-hidden
        rounded-[32px]
        border
        backdrop-blur-3xl
        p-8
        bg-white/[0.05]
        ${appearance.borderClass}
      `}
    >
      {/* Ambient Glow */}

      <div
        className={`
          absolute
          inset-0
          bg-gradient-to-br
          ${appearance.glowClass}
          opacity-60
        `}
      />

      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
        }}
        className="
          absolute
          -right-24
          -top-24
          h-80
          w-80
          rounded-full
          bg-cyan-500/10
          blur-3xl
        "
      />

      <div className="relative">
        {/* Badge */}

        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2">
          <Brain
            size={16}
            className="text-cyan-300"
          />

          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Cosmic AI Recommendation
          </span>
        </div>

        {/* Mission */}

        <h2 className="mt-6 text-4xl font-bold tracking-tight text-white">
          {coach.recommendation.title}
        </h2>

        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/70">
          {coach.recommendation.reason}
        </p>

        {/* Task */}

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-white/45">
            Next Task
          </div>

          <div className="mt-2 text-2xl font-semibold text-white">
            {task.title}
          </div>

          {task.description && (
            <p className="mt-3 text-white/60 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Stats */}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard
            icon={<Sparkles size={18} />}
            label="Confidence"
            value={formatConfidence(
              coach.recommendation.confidence
            )}
          />

          <StatCard
            icon={<Clock3 size={18} />}
            label="Estimated Time"
            value={`${task.estimatedMinutes} min`}
          />

          <StatCard
            icon={<Brain size={18} />}
            label="Priority"
            value={appearance.label}
          />
        </div>

        {/* ETA */}

        {coach.recommendation
          .estimatedCompletionTime && (
          <div className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">
              Estimated Finish
            </div>

            <div className="mt-2 text-xl font-semibold text-white">
              {
                coach.recommendation
                  .estimatedCompletionTime
              }
            </div>
          </div>
        )}

        {/* Action */}

        <motion.button
          whileHover={{
            x: 4,
          }}
          whileTap={{
            scale: 0.98,
          }}
          className="
            mt-8
            flex
            items-center
            gap-2
            rounded-2xl
            border
            border-white/10
            bg-white/5
            px-5
            py-3
            text-white
            transition-all
            hover:border-white/20
            hover:bg-white/10
          "
        >
          Start This Task

          <ArrowRight size={16} />
        </motion.button>
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
      <div className="flex items-center gap-2 text-cyan-300">
        {icon}
      </div>

      <div className="mt-3 text-xs uppercase tracking-[0.15em] text-white/45">
        {label}
      </div>

      <div className="mt-2 text-xl font-semibold text-white">
        {value}
      </div>
    </div>
  );
}