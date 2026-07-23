"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import type { QuickAction } from "./quickActionTypes";

interface QuickActionButtonProps {
  action: QuickAction;
}

export default function QuickActionButton({
  action,
}: QuickActionButtonProps) {
  const Icon = action.icon;

  return (
    <motion.div
      whileHover={{
        y: -4,
        scale: 1.02,
      }}
      whileTap={{
        scale: 0.98,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 24,
      }}
    >
      <Link
        href={action.disabled ? "#" : action.href}
        aria-disabled={action.disabled}
        className={`
          group
          relative
          flex
          h-full
          flex-col
          overflow-hidden
          rounded-[24px]
          border
          border-white/10
          bg-white/[0.045]
          p-5
          backdrop-blur-3xl
          transition-all
          duration-300

          ${
            action.disabled
              ? "pointer-events-none opacity-50"
              : "hover:border-white/20 hover:bg-white/[0.07]"
          }
        `}
      >
        {/* Notification Dot */}

        {action.notification && (
          <div
            className="
              absolute
              right-4
              top-4
              h-3
              w-3
              rounded-full
              bg-red-500
              ring-2
              ring-neutral-950
            "
          />
        )}

        {/* Badge */}

        {action.badge && (
          <div
            className="absolute left-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]"
            style={{
              backgroundColor:
                action.badge.color ??
                "rgba(255,255,255,0.08)",
              color: "white",
            }}
          >
            {action.badge.value}
          </div>
        )}

        <div className="mt-6">
          <div
            className="inline-flex rounded-2xl p-3"
            style={{
              backgroundColor: `${action.color}22`,
              color: action.color,
            }}
          >
            <Icon size={26} />
          </div>
        </div>

        <div className="mt-6 flex-1">
          <h3 className="text-lg font-semibold text-white">
            {action.title}
          </h3>

          {action.subtitle && (
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              {action.subtitle}
            </p>
          )}
        </div>

        <div
          className="
            mt-6
            flex
            items-center
            justify-end
            text-white/35
            transition-colors
            group-hover:text-white/75
          "
        >
          <ArrowUpRight size={18} />
        </div>
      </Link>
    </motion.div>
  );
}