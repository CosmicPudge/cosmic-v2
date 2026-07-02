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
        mb-10
        flex
        items-center
        justify-between
        rounded-3xl
        border
        border-white/10
        bg-white/5
        backdrop-blur-xl
        px-8
        py-7
      "
    >
      <div className="flex items-center gap-6">
        {icon && (
          <div className="text-5xl">
            {icon}
          </div>
        )}

        <div>
          <h1 className="text-4xl font-bold tracking-tight">
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
        <div>
          {rightContent}
        </div>
      )}
    </section>
  );
}