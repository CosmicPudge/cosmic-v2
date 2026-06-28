"use client";

import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {}

export default function GlassButton({
  children,
  className = "",
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={[
        "rounded-xl",
        "border border-white/10",
        "bg-white/5",
        "px-4",
        "py-2",
        "backdrop-blur-xl",
        "transition-all",
        "duration-300",
        "hover:bg-white/10",
        "hover:scale-105",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
