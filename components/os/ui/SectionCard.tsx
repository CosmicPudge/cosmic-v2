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
    <div className="rounded-xl bg-white/5 p-5">
      <h2 className="mb-4 text-lg font-semibold">
        {title}
      </h2>

      {children}
    </div>
  );
}