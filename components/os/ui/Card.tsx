"use client";

import { ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  children,
  className,
  hover = false,
  padding = "md",
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-3xl",
        "border border-white/10",
        "bg-white/[0.04]",
        "shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
        "backdrop-blur-2xl",
        "transition-all duration-300",
        paddingClasses[padding],
        hover &&
          "hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.45)]",
        className
      )}
    >
      {children}
    </div>
  );
}