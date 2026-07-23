"use client";

import { motion } from "framer-motion";

import FocusMission from "./FocusMission";
import FocusProgress from "./FocusProgress";
import FocusTasks from "./FocusTasks";
import { FocusData } from "./focusTypes";

interface FocusCardProps {
  data: FocusData;
}

export default function FocusCard({
  data,
}: FocusCardProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 24,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
      }}
      className="space-y-8"
    >
      {/* Top Row */}

      <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">
        <FocusMission mission={data.mission} />

        <FocusProgress
          progress={data.progress}
        />
      </div>

      {/* Bottom Row */}

      <FocusTasks tasks={data.tasks} />
    </motion.div>
  );
}