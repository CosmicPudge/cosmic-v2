"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function NotificationEmpty() {
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
        p-8
        backdrop-blur-2xl
      "
    >
      {/* Ambient Glow */}

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-br
          from-emerald-500/10
          via-transparent
          to-transparent
        "
      />

      <div className="relative flex flex-col items-center text-center">

        <motion.div
          animate={{
            scale: [1, 1.05, 1],
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
            border-emerald-500/20
            bg-emerald-500/10
            text-emerald-300
          "
        >
          <CheckCircle2 size={32} />
        </motion.div>

        <h3 className="mt-6 text-xl font-semibold text-white">
          You're All Caught Up
        </h3>

        <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
          Nothing needs your attention right now.
          Enjoy the calm and keep up the great work.
        </p>

      </div>
    </motion.div>
  );
}