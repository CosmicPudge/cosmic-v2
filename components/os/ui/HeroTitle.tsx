"use client";

import { ReactNode } from "react";
import clsx from "clsx";

interface HeroTitleProps {
  eyebrow?: string;
  title: string;
  headline?: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function HeroTitle({
  eyebrow,
  title,
  headline,
  description,
  icon,
  actions,
  className,
}: HeroTitleProps) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between",
        className
      )}
    >
      <div className="max-w-4xl">
        {eyebrow && (
          <p
            className="
              text-sm
              uppercase
              tracking-[0.35em]
              text-violet-300
            "
          >
            {eyebrow}
          </p>
        )}

        <div className="mt-4 flex items-center gap-5">
          {icon}

          <h1
            className="
              text-6xl
              font-bold
              tracking-[-0.04em]
              text-white
              lg:text-7xl
              xl:text-8xl
            "
          >
            {title}
          </h1>
        </div>

        {headline && (
          <p
            className="
              mt-6
              text-2xl
              font-medium
              text-white
            "
          >
            {headline}
          </p>
        )}

        {description && (
          <p
            className="
              mt-3
              max-w-3xl
              text-lg
              leading-8
              text-white/60
            "
          >
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}