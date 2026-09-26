"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  label: string;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "accent" | "danger";
}

export default function IconButton({ children, label, size = "md", tone = "default", className, ...props }: IconButtonProps) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      aria-label={label}
      title={props.title ?? label}
      className={clsx("cosmic-icon-button", `cosmic-icon-button-${size}`, `cosmic-icon-button-${tone}`, className)}
    >
      {children}
    </button>
  );
}
