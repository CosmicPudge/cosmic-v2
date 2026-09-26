"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;

  variant?: "primary" | "secondary" | "ghost" | "danger";

  size?: "sm" | "md" | "lg";

  fullWidth?: boolean;
}

const sizeClasses = {
  sm: "min-h-9 px-3 text-xs",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-6 text-base",
};

const variantClasses = {
  primary:
    "cosmic-button-primary",

  secondary:
    "cosmic-button-secondary",

  ghost:
    "cosmic-button-ghost",
  danger:
    "cosmic-button-danger",
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
        "cosmic-button",
        "cursor-pointer",
        "disabled:opacity-50",
        "disabled:cursor-not-allowed",

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
