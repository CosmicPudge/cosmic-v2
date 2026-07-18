"use client";

import { ReactNode } from "react";
import clsx from "clsx";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  icon,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={clsx(
        "flex items-start justify-between gap-6",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              border
              border-white/10
              bg-white/[0.04]
              text-violet-300
            "
          >
            {icon}
          </div>
        )}

        <div>
          <h2
            className="
              text-2xl
              font-semibold
              tracking-tight
              text-white
            "
          >
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-sm text-white/60">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}