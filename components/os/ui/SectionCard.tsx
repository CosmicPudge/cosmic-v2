"use client";

import { ReactNode } from "react";
import CosmicCard from "@/design-system/components/CosmicCard";

interface SectionCardProps {
  title: string;
  children: ReactNode;
}

export default function SectionCard({ title, children }: SectionCardProps) {
  return (
    <CosmicCard className="p-5 sm:p-6">
      <h2 className="mb-4 text-base font-semibold tracking-tight text-white sm:text-lg">{title}</h2>
      {children}
    </CosmicCard>
  );
}
