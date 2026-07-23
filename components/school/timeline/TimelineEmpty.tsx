"use client";

import { motion } from "framer-motion";
import { CalendarCheck2 } from "lucide-react";

export default function TimelineEmpty() {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
      }}
      className="
        relative
        overflow-hidden
        rounded-[28px]
        border
        border-white/10
        bg-white/[0.045]
        p-10
        backdrop-blur-2xl
      "
    >
      {/* Ambient Glow */}

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-br
          from-sky-500/10
          via-transparent
          to-transparent
        "
      />

      <div className="relative flex flex-col items-center text-center">

        <motion.div
          animate={{
            scale: [1, 1.04, 1],
            opacity: [0.9, 1, 0.9],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-full
            border
            border-sky-500/20
            bg-sky-500/10
            text-sky-300
          "
        >
          <CalendarCheck2 size={32} />
        </motion.div>

        <h3 className="mt-6 text-2xl font-semibold text-white">
          Your Schedule Is Clear
        </h3>

        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
          Nothing is scheduled for this time period.
          New classes, assignments, meetings, and AI
          recommendations will automatically appear here.
        </p>

      </div>
    </motion.section>
  );
}