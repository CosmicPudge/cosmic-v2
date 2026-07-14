"use client";

import type { ReactNode } from "react";

interface AmbientSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export default function AmbientSection({
  title,
  children,
  className = "",
}: AmbientSectionProps) {
  return (
    <section
      className={`
        h-full
        rounded-3xl
        border border-white/10
        bg-white/5
        p-6
        backdrop-blur-xl
        ${className}
      `}
    >
      <h2 className="mb-4 text-xs uppercase tracking-[0.3em] text-white/50">
        {title}
      </h2>

      {children}
    </section>
  );
}