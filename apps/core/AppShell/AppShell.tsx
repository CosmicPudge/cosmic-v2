"use client";

import clsx from "clsx";

import type { AppShellProps } from "./types";

export default function AppShell({
  presentation,
  children,
  className,
}: AppShellProps) {
  return (
    <div
      className={clsx(
        "flex h-full w-full flex-col overflow-hidden",
        {
          widget: "rounded-[28px]",
          window: "rounded-none",
          fullscreen: "rounded-none",
        }[presentation],
        className
      )}
    >
      {children}
    </div>
  );
}