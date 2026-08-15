"use client";

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function BootBackground({
  children,
}: Props) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-black/70">
      <svg
  className="absolute inset-0 h-full w-full opacity-80"
  viewBox="0 0 100 100"
  preserveAspectRatio="none"
>
</svg>

      {/* Soft vignette */}
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 flex h-full items-center justify-center">
        {children}
      </div>

    </div>
  );
}
