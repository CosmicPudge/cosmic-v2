"use client";

import { ReactNode } from "react";

interface PageHeroProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  rightContent?: ReactNode;
}

export default function PageHero({
  icon,
  title,
  subtitle,
  rightContent,
}: PageHeroProps) {
  return (
    <section
      className="
        cosmic-panel
        mb-8
        flex
        items-center
        justify-between
        px-5
        py-6
        sm:px-8
        sm:py-7
      "
    >
      <div className="flex min-w-0 items-center gap-4 sm:gap-6">
        {icon && (
          <div className="text-5xl">
            {icon}
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-2 text-white/60">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {rightContent && (
        <div className="shrink-0">
          {rightContent}
        </div>
      )}
    </section>
  );
}
