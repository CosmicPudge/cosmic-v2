"use client";

import { motion } from "framer-motion";

import QuickActionButton from "./QuickActionButton";
import type { QuickAction } from "./quickActionTypes";

interface QuickActionsGridProps {
  actions: QuickAction[];
}

export default function QuickActionsGrid({
  actions,
}: QuickActionsGridProps) {
  if (actions.length === 0) {
    return (
      <motion.div
        initial={{
          opacity: 0,
          y: 12,
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
          p-10
          text-center
          backdrop-blur-3xl
        "
      >
        <h2 className="text-xl font-semibold text-white">
          No Quick Actions
        </h2>

        <p className="mt-3 text-white/60">
          Add actions to begin building your command center.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      className="
        grid
        gap-6
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
      "
    >
      {actions.map((action, index) => (
        <motion.div
          key={action.id}
          initial={{
            opacity: 0,
            y: 18,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: index * 0.04,
          }}
        >
          <QuickActionButton
            action={action}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}