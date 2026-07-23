"use client";

import { motion } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface NotificationHeaderProps {
  notificationCount: number;
}

function getStatus(notificationCount: number) {
  if (notificationCount === 0) {
    return {
      label: "All Caught Up",
      icon: CheckCircle2,
      color: "text-emerald-300",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    };
  }

  if (notificationCount <= 3) {
    return {
      label: "Everything Under Control",
      icon: Bell,
      color: "text-sky-300",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
    };
  }

  return {
    label: "Attention Needed",
    icon: AlertTriangle,
    color: "text-orange-300",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    };
}

export default function NotificationHeader({
  notificationCount,
}: NotificationHeaderProps) {
  const status = getStatus(notificationCount);

  const StatusIcon = status.icon;

  return (
    <div className="flex items-start justify-between gap-6">

      <div>

        <div className="flex items-center gap-2 text-white/45">

          <Bell size={15} />

          <span className="text-[11px] uppercase tracking-[0.3em]">
            School Feed
          </span>

        </div>

        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">
          Notifications
        </h2>

      </div>

      <motion.div
        whileHover={{
          scale: 1.03,
        }}
        className={`
          flex
          items-center
          gap-3
          rounded-2xl
          border
          px-4
          py-3
          backdrop-blur-xl
          ${status.bg}
          ${status.border}
        `}
      >

        <div
          className={`
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-white/5
            ${status.color}
          `}
        >
          <StatusIcon size={18} />
        </div>

        <div>

          <p className="text-lg font-bold text-white">
            {notificationCount}
          </p>

          <p className={`text-xs font-medium ${status.color}`}>
            {status.label}
          </p>

        </div>

      </motion.div>

    </div>
  );
}