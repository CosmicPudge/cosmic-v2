"use client";

import type { ReactNode } from "react";
import AnimatedBackground from "../effects/AnimatedBackground";
import Stars from "@/components/icons/primitives/Stars";

interface Props {
  children: ReactNode;
}

export default function BootBackground({
  children,
}: Props) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-black">

      <AnimatedBackground />

      <div className="absolute inset-0 opacity-80">
        <Stars density="dense" />
      </div>

      {/* Soft vignette */}
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 flex h-full items-center justify-center">
        {children}
      </div>

    </div>
  );
}