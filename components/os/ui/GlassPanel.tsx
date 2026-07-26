"use client";

import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";

type GlassVariant =
  | "hero"
  | "default"
  | "subtle"
  | "elevated";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  variant?: GlassVariant;
  hover?: boolean;

  style?: CSSProperties;
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
  style,
}: GlassPanelProps) {
  return (
    <div
      style={style}
      className={clsx(
        "relative overflow-hidden rounded-[36px] border transition-all duration-300",

        variants[variant],

        hover && [
          "hover:-translate-y-1",
          "hover:border-white/20",
          "hover:bg-white/[0.06]",
        ],

        className
      )}
    >
      {/* Ambient light */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,.12),transparent_60%)]
        "
      />

      {/* Soft top highlight */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-gradient-to-b
          from-white/[0.06]
          via-transparent
          to-transparent
        "
      />

      {/* Bottom depth */}
      <div
        className="
          pointer-events-none
          absolute
          inset-x-0
          bottom-0
          h-24
          bg-gradient-to-t
          from-black/10
          to-transparent
        "
      />

      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
}