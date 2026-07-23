"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

import GlassPanel from "@/components/os/ui/GlassPanel";

export type SchoolCardAccent =
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "purple"
  | "cyan"
  | "default";

interface SchoolCardProps {
  title: string;
  subtitle?: string;

  badge?: string;

  accent?: SchoolCardAccent;

  footer?: ReactNode;

  children: ReactNode;

  className?: string;

  hover?: boolean;
}

const accentStyles: Record<SchoolCardAccent, string> = {
  default: "from-white/8 to-white/[0.02]",
  blue: "from-sky-500/15 to-transparent",
  green: "from-emerald-500/15 to-transparent",
  orange: "from-orange-500/15 to-transparent",
  red: "from-red-500/15 to-transparent",
  purple: "from-violet-500/15 to-transparent",
  cyan: "from-cyan-500/15 to-transparent",
};

export default function SchoolCard({
  title,
  subtitle,
  badge,
  accent = "default",
  footer,
  children,
  className,
  hover = true,
}: SchoolCardProps) {
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
        duration: 0.45,
      }}
      className={className}
    >
      <GlassPanel
        hover={hover}
        className={clsx(
          "relative overflow-hidden p-6 lg:p-7"
        )}
      >
        {/* Accent Glow */}
        <div
          className={clsx(
            "pointer-events-none absolute inset-0 bg-gradient-to-br",
            accentStyles[accent]
          )}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col">
          <header className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-white">
                {title}
              </h3>

              {subtitle && (
                <p className="mt-1 text-sm text-white/60">
                  {subtitle}
                </p>
              )}
            </div>

            {badge && (
              <div
                className="
                  rounded-full
                  border
                  border-white/10
                  bg-white/5
                  px-3
                  py-1
                  text-xs
                  font-medium
                  text-white/80
                  backdrop-blur-xl
                "
              >
                {badge}
              </div>
            )}
          </header>

          <div className="flex-1">
            {children}
          </div>

          {footer && (
            <>
              <div className="my-5 h-px bg-white/8" />

              <footer>
                {footer}
              </footer>
            </>
          )}
        </div>
      </GlassPanel>
    </motion.div>
  );
}