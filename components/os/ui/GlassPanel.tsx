"use client";

import { ReactNode } from "react";
import clsx from "clsx";

type GlassVariant = "hero" | "default" | "subtle" | "elevated";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: GlassVariant;
  hover?: boolean;
}

const variants: Record<GlassVariant, string> = {
  hero: `
    bg-white/[0.045]
    border-white/[0.08]
    backdrop-blur-3xl
    shadow-[0_30px_80px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.05)]
  `,

  default: `
    bg-white/[0.05]
    border-white/[0.10]
    backdrop-blur-2xl
    shadow-[0_20px_50px_rgba(0,0,0,0.30)]
  `,

  subtle: `
    bg-white/[0.03]
    border-white/[0.06]
    backdrop-blur-xl
  `,

  elevated: `
    bg-white/[0.06]
    border-white/[0.10]
    backdrop-blur-3xl
    shadow-[0_40px_90px_rgba(0,0,0,0.45)]
  `,
};

export default function GlassPanel({
  children,
  className,
  variant = "default",
  hover = false,
}: GlassPanelProps) {
  return (
    <div
      className={clsx(
        "rounded-3xl border transition-all duration-300",

        variants[variant],

        hover && [
          "hover:-translate-y-1",
          "hover:border-white/20",
          "hover:bg-white/[0.06]",
        ],

        className
      )}
    >
      {children}
    </div>
  );
}