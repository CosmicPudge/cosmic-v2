"use client";

import { motion } from "framer-motion";

import { buildPriorities } from "./priorityHelpers";
import PriorityHeader from "./PriorityHeader";
import PriorityItem from "./PriorityItem";
import type { PriorityData } from "./priorityTypes";

interface PriorityCardProps {
  data: PriorityData;
}

export default function PriorityCard({
  data,
}: PriorityCardProps) {
  const state = buildPriorities(data);

  return (
    <div className="space-y-8">
      <PriorityHeader
        summary={state.summary}
        recommendation={state.recommendation}
      />

      <motion.section
        initial={{
          opacity: 0,
          y: 16,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.15,
        }}
        className="
          rounded-[32px]
          border
          border-white/10
          bg-white/[0.045]
          backdrop-blur-3xl
          p-6
        "
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Priority Queue
            </h2>

            <p className="mt-2 text-sm text-white/60">
              Automatically ranked tasks from all connected
              School modules.
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/60">
            {state.summary.total} Total
          </div>
        </div>

        {state.priorities.length === 0 ? (
          <div
            className="
              rounded-[24px]
              border
              border-dashed
              border-white/10
              py-16
              text-center
            "
          >
            <h3 className="text-xl font-semibold text-white">
              You're all caught up!
            </h3>

            <p className="mt-3 text-white/55">
              No active priorities right now.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {state.priorities.map((priority) => (
              <PriorityItem
                key={priority.id}
                priority={priority}
              />
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}