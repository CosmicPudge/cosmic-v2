"use client";

import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

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
        "cursor-pointer",
        "hover:bg-white/10",
        "hover:scale-105",
        "active:scale-[0.98]",
        "disabled:cursor-not-allowed",
        "disabled:opacity-50",
        "disabled:hover:brightness-100",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
