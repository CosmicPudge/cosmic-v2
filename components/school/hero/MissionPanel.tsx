"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock3,
  Flag,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

export interface MissionPanelProps {
  title: string;
  description: string;
  due: string;
  estimatedTime: string;
  priority: "Low" | "Medium" | "High";
}

export default function MissionPanel({
  title,
  description,
  due,
  estimatedTime,
  priority,
}: MissionPanelProps) {
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
        duration: 0.55,
      }}
      className="
        relative
        overflow-hidden
        rounded-[32px]
        border
        border-white/10
        bg-white/[0.045]
        backdrop-blur-3xl
        shadow-2xl
      "
    >
      {/* Ambient Glow */}

      <div
        className="
          absolute
          -right-24
          -top-24
          h-72
          w-72
          rounded-full
          bg-violet-500/15
          blur-3xl
        "
      />

      <div
        className="
          absolute
          -bottom-20
          left-0
          h-60
          w-60
          rounded-full
          bg-cyan-400/10
          blur-3xl
        "
      />

      {/* Glass Shine */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-gradient-to-br
          from-white/8
          via-transparent
          to-transparent
        "
      />

      <div className="relative z-10 p-10 lg:p-12">

        {/* Header */}

        <div className="flex items-center justify-between">

          <div>

            <p className="text-xs uppercase tracking-[0.35em] text-violet-300">
              Today's Mission
            </p>

            <h2 className="mt-4 text-5xl font-bold tracking-tight text-white lg:text-6xl">
              {title}
            </h2>

          </div>

          <PriorityChip priority={priority} />

        </div>

        {/* Description */}

        <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
          {description}
        </p>

        {/* Info */}

        <div className="mt-10 flex flex-wrap gap-4">

          <InfoChip
            icon={<Clock3 size={17} />}
            title="Deadline"
            value={due}
          />

          <InfoChip
            icon={<Sparkles size={17} />}
            title="Focus Time"
            value={estimatedTime}
          />

        </div>

        {/* CTA */}

        <motion.button
          whileHover={{
            x: 4,
          }}
          whileTap={{
            scale: 0.98,
          }}
          className="
            group
            mt-10
            flex
            items-center
            gap-3
            rounded-2xl
            border
            border-violet-400/20
            bg-violet-500/15
            px-5
            py-3
            text-sm
            font-medium
            text-violet-100
            transition-all
            hover:border-violet-300/40
            hover:bg-violet-500/20
          "
        >
          Begin Focus Session

          <ArrowRight
            size={18}
            className="
              transition-transform
              duration-300
              group-hover:translate-x-1
            "
          />
        </motion.button>

      </div>
    </motion.div>
  );
}

function InfoChip({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div
      className="
        min-w-[170px]
        rounded-2xl
        border
        border-white/10
        bg-white/[0.04]
        px-5
        py-4
        backdrop-blur-xl
      "
    >
      <div className="flex items-center gap-2 text-white/60">

        {icon}

        <span className="text-xs uppercase tracking-[0.2em]">
          {title}
        </span>

      </div>

      <p className="mt-3 text-lg font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function PriorityChip({
  priority,
}: {
  priority: "Low" | "Medium" | "High";
}) {
  const style =
    priority === "High"
      ? "border-red-400/30 bg-red-500/15 text-red-300"
      : priority === "Medium"
      ? "border-yellow-400/30 bg-yellow-500/15 text-yellow-300"
      : "border-emerald-400/30 bg-emerald-500/15 text-emerald-300";

  return (
    <div
      className={`
        flex
        items-center
        gap-2
        rounded-full
        border
        px-5
        py-2.5
        text-sm
        font-semibold
        backdrop-blur-xl
        ${style}
      `}
    >
      <Flag size={15} />

      {priority} Priority
    </div>
  );
}