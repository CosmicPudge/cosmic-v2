"use client";

import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";

import {
  getNotificationAppearance,
  getSourceLabel,
} from "./notificationHelpers";
import { SchoolNotification } from "./notificationTypes";

interface NotificationItemProps {
  notification: SchoolNotification;
  index?: number;
}

export default function NotificationItem({
  notification,
  index = 0,
}: NotificationItemProps) {
  const appearance = getNotificationAppearance(
    notification.type
  );

  const Icon = appearance.icon;

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
        delay: index * 0.05,
        duration: 0.35,
      }}
      whileHover={{
        y: -2,
      }}
      className={`
        group
        relative
        overflow-hidden
        rounded-2xl
        border
        border-white/10
        bg-white/[0.04]
        backdrop-blur-xl
        transition-all
        duration-300
        hover:bg-white/[0.07]
        hover:border-white/20
        ${appearance.borderClass}
      `}
    >
      {/* Accent Bar */}

      <div
        className={`
          absolute
          left-0
          top-0
          h-full
          w-1
          transition-all
          duration-300
          group-hover:w-1.5
          ${appearance.accentClass}
        `}
      />

      {/* Ambient Glow */}

      <div
        className={`
          absolute
          inset-0
          bg-gradient-to-r
          ${appearance.glowClass}
          opacity-0
          transition-opacity
          duration-300
          group-hover:opacity-100
        `}
      />

      <div className="relative flex items-start gap-4 p-5">

        {/* Icon */}

        <div
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-white/5
            ${appearance.iconClass}
          `}
        >
          <Icon size={20} />
        </div>

        {/* Content */}

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <h4 className="font-semibold text-white">
              {notification.title}
            </h4>

            {notification.aiGenerated && (
              <div className="flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-300">
                <Sparkles size={10} />
                AI
              </div>
            )}

          </div>

          <p className="mt-1 text-sm leading-relaxed text-white/70">
            {notification.message}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/45">

            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
              {getSourceLabel(notification.source)}
            </span>

            <span>•</span>

            <span>{notification.timestamp}</span>

          </div>

        </div>

        {/* Arrow */}

        <motion.div
          initial={{
            opacity: 0,
            x: -6,
          }}
          whileHover={{
            opacity: 1,
            x: 0,
          }}
          className="self-center text-white/30"
        >
          <ChevronRight size={18} />
        </motion.div>

      </div>
    </motion.div>
  );
}