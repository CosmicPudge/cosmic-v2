"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  XCircle,
} from "lucide-react";

import {
  getReadinessAppearance,
} from "./afrotcHelpers";
import type {
  AFROTCState,
  ReadinessItem,
} from "./afrotcTypes";

interface ReadinessCardProps {
  state: AFROTCState;
}

export default function ReadinessCard({
  state,
}: ReadinessCardProps) {
  const summary = state.readinessSummary;

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
      className="
        rounded-[28px]
        border
        border-white/10
        bg-white/[0.045]
        backdrop-blur-3xl
        p-6
      "
    >
      <div className="flex items-center gap-3">
        <ClipboardCheck
          size={22}
          className="text-emerald-300"
        />

        <div>
          <h2 className="text-xl font-semibold text-white">
            Cadet Readiness
          </h2>

          <p className="text-sm text-white/55">
            Verify you're prepared for your next AFROTC activity.
          </p>
        </div>
      </div>

      <div
        className="
          mt-6
          rounded-2xl
          border
          border-emerald-500/20
          bg-emerald-500/10
          p-5
        "
      >
        <div className="text-xs uppercase tracking-[0.18em] text-emerald-300">
          Overall Readiness
        </div>

        <div className="mt-2 flex items-end gap-3">
          <div className="text-5xl font-bold text-white">
            {summary.score}%
          </div>

          <div className="pb-2 text-white/60">
            {summary.completed} of {summary.total} items complete
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${summary.score}%`,
            }}
            transition={{
              duration: 0.8,
            }}
            className="
              h-full
              rounded-full
              bg-gradient-to-r
              from-emerald-400
              to-cyan-400
            "
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {state.readiness.map((item, index) => (
          <ReadinessRow
            key={item.id}
            item={item}
            index={index}
          />
        ))}
      </div>
    </motion.section>
  );
}

interface ReadinessRowProps {
  item: ReadinessItem;
  index: number;
}

function ReadinessRow({
  item,
  index,
}: ReadinessRowProps) {
  const appearance =
    getReadinessAppearance(item.status);

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
      transition={{
        delay: index * 0.04,
      }}
      className="
        flex
        items-start
        justify-between
        gap-4
        rounded-2xl
        border
        border-white/10
        bg-white/[0.03]
        p-4
      "
    >
      <div className="flex items-start gap-3">
        {item.status === "complete" && (
          <CheckCircle2
            size={20}
            className="mt-0.5 text-emerald-300"
          />
        )}

        {item.status === "attention" && (
          <AlertTriangle
            size={20}
            className="mt-0.5 text-amber-300"
          />
        )}

        {item.status === "missing" && (
          <XCircle
            size={20}
            className="mt-0.5 text-red-300"
          />
        )}

        <div>
          <div className="font-medium text-white">
            {item.title}
          </div>

          {item.description && (
            <div className="mt-1 text-sm text-white/55">
              {item.description}
            </div>
          )}
        </div>
      </div>

      <div
        className={`
          rounded-full
          border
          px-3
          py-1
          text-xs
          font-semibold
          uppercase
          tracking-[0.15em]
          ${appearance.className}
        `}
      >
        {appearance.label}
      </div>
    </motion.div>
  );
}