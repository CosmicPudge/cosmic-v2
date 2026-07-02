"use client";

import { ReactNode } from "react";

interface AppSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export default function AppSection({
  title,
  subtitle,
  children,
  className = "",
}: AppSectionProps) {
  return (
    <section
      className={`
        rounded-3xl
        border border-white/10
        bg-white/5
        backdrop-blur-xl
        shadow-2xl
        p-6
        ${className}
      `}
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-sm text-white/50">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}