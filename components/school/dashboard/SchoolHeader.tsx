"use client";

import { motion } from "framer-motion";
import {
  Bell,
  Search,
  Settings,
  UserCircle2,
  Wifi,
} from "lucide-react";

interface SchoolHeaderProps {
  title?: string;
  notificationCount?: number;
  online?: boolean;
}

export default function SchoolHeader({
  title = "School",
  notificationCount = 0,
  online = true,
}: SchoolHeaderProps) {
  return (
    <motion.header
      initial={{
        opacity: 0,
        y: -12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
      }}
      className="
        flex
        flex-col
        gap-5
        rounded-[28px]
        border
        border-white/10
        bg-white/[0.045]
        p-6
        backdrop-blur-3xl
        lg:flex-row
        lg:items-center
        lg:justify-between
      "
    >
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-cyan-300">
          Cosmic
        </p>

        <h2 className="mt-1 text-3xl font-bold text-white">
          {title}
        </h2>
      </div>

      <div className="flex flex-1 items-center gap-4 lg:justify-end">
        <div
          className="
            flex
            flex-1
            items-center
            gap-3
            rounded-2xl
            border
            border-white/10
            bg-white/[0.03]
            px-4
            py-3
            lg:max-w-md
          "
        >
          <Search
            size={18}
            className="text-white/45"
          />

          <input
            type="text"
            placeholder="Search School..."
            className="
              w-full
              bg-transparent
              text-sm
              text-white
              outline-none
              placeholder:text-white/35
            "
          />
        </div>

        <StatusButton>
          <Wifi
            size={18}
            className={
              online
                ? "text-emerald-400"
                : "text-red-400"
            }
          />
        </StatusButton>

        <StatusButton>
          <div className="relative">
            <Bell size={18} />

            {notificationCount > 0 && (
              <span
                className="
                  absolute
                  -right-1.5
                  -top-1.5
                  flex
                  h-5
                  min-w-[20px]
                  items-center
                  justify-center
                  rounded-full
                  bg-red-500
                  px-1
                  text-[10px]
                  font-bold
                  text-white
                "
              >
                {notificationCount}
              </span>
            )}
          </div>
        </StatusButton>

        <StatusButton>
          <Settings size={18} />
        </StatusButton>

        <button
          className="
            flex
            items-center
            gap-3
            rounded-2xl
            border
            border-white/10
            bg-white/[0.03]
            px-4
            py-3
            transition
            hover:bg-white/[0.06]
          "
        >
          <UserCircle2
            size={24}
            className="text-cyan-300"
          />

          <span className="hidden text-sm font-medium text-white sm:block">
            Profile
          </span>
        </button>
      </div>
    </motion.header>
  );
}

interface StatusButtonProps {
  children: React.ReactNode;
}

function StatusButton({
  children,
}: StatusButtonProps) {
  return (
    <button
      className="
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-2xl
        border
        border-white/10
        bg-white/[0.03]
        text-white/70
        transition
        hover:bg-white/[0.06]
        hover:text-white
      "
    >
      {children}
    </button>
  );
}