"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;

  variant?: "primary" | "secondary" | "ghost";

  size?: "sm" | "md" | "lg";

  fullWidth?: boolean;
}

const sizeClasses = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

const variantClasses = {
  primary:
    "bg-blue-500 text-white hover:bg-blue-400",

  secondary:
    "bg-white/10 text-white border border-white/10 hover:bg-white/15",

  ghost:
    "bg-transparent text-white hover:bg-white/10",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "rounded-2xl",
        "font-medium",
        "transition-all",
        "duration-200",
        "active:scale-95",
        "disabled:opacity-50",
        "disabled:pointer-events-none",

        sizeClasses[size],
        variantClasses[variant],

        fullWidth && "w-full",

        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}