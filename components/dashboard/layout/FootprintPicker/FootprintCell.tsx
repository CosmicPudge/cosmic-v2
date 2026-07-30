"use client";

import { motion } from "framer-motion";

import type { FootprintCellProps } from "./types";

export default function FootprintCell({
  row,
  col,
  active,
  onHover,
  onSelect,
}: FootprintCellProps) {
  return (
    <motion.button
      type="button"
      onMouseEnter={() => onHover(row, col)}
      onClick={() => onSelect(row, col)}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      transition={{
        duration: 0.16,
        ease: "easeOut",
      }}
      className={`
        aspect-square
        rounded-md
        border
        transition-all
        duration-200

        ${
          active
            ? `
              border-cyan-300/70
              bg-cyan-400/30
              shadow-[0_0_12px_rgba(34,211,238,0.45)]
            `
            : `
              border-white/10
              bg-white/5
              hover:border-white/20
              hover:bg-white/10
            `
        }
      `}
    />
  );
}