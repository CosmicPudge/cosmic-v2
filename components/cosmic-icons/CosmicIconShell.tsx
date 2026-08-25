"use client";

import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";

type Props = {
  size: number;
  glow?: string;
  interactive?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

const CosmicIconShell = forwardRef<HTMLSpanElement, Props>(function CosmicIconShell({ size, glow = "purple", interactive = false, className = "", children, ...props }, ref) {
  const classes = `cosmic-icon-shell cosmic-icon-glow-${glow} ${interactive ? "cosmic-icon-interactive" : ""} ${className}`;
  const style = { width: size, height: size, ...(props.style ?? {}) };
  if (interactive) {
    return <button type="button" {...(props as ButtonHTMLAttributes<HTMLButtonElement>)} className={classes} style={style}>{children}</button>;
  }
  return <span ref={ref} {...(props as HTMLAttributes<HTMLSpanElement>)} className={classes} style={style}>{children}</span>;
});

CosmicIconShell.displayName = "CosmicIconShell";

export default CosmicIconShell;
