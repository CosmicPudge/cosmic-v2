"use client";

import { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  children: ReactNode;
}

export default function SectionCard({
  title,
  children,
}: SectionCardProps) {
  return (
    <section className="cosmic-panel p-5">
      <h2 className="mb-4 text-base font-semibold tracking-tight sm:text-lg">
        {title}
      </h2>

      {children}
    </section>
  );
}
